const crypto=require('node:crypto');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const validId=id=>typeof id==='string'&&/^[\w-]{1,128}$/.test(id);
const clean=(value,max=200)=>typeof value==='string'?value.trim().slice(0,max):'';
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
function roleOf(user){const role=user.role??'student';if(!['teacher','student'].includes(role))throw fail(403,'Your account role is not enabled.');return role;}
const homeOf=user=>roleOf(user)==='teacher'?'teacher.html':'dashboard.html';
const classesFor=(store,user)=>roleOf(user)==='teacher'?store.queryData('classes','teacherId',user.id):store.queryData('classes','studentIds',user.id,true);
async function classFor(store,user,id){if(!validId(id))throw fail(400,'Invalid class.');const course=await store.getData('classes',id);if(!course||(roleOf(user)==='teacher'?course.teacherId!==user.id:!course.studentIds?.includes(user.id)))throw fail(403,'You do not have access to this class.');return {...course,id};}
async function studentCourses(store,user){return Promise.all((await classesFor(store,user)).map(async course=>{const grade=await store.getData('classGrades',course.id+'_'+user.id);const teacher=await store.getUser(course.teacherId);const {teacherId,studentIds,...safe}=course;return {...safe,teacher:teacher?.fullName||'Instructor',grade:grade?.grade||'Pending'};}));}
async function rolesApi({req,res,url,user,store,json,bodyOf}){
  if(await require('./subject-enrollment').enrollmentApi({req,res,url,user,store,json,bodyOf}))return true;
  const route=url.pathname;if(!/^\/api\/(teacher|student)\//.test(route))return false;
  const role=route.split('/')[2];if(roleOf(user)!==role)throw fail(403,'This feature is for '+role+' accounts only.');
  if(route==='/api/teacher/classes'&&req.method==='GET'){json(res,200,{classes:(await classesFor(store,user)).map(({studentIds,...course})=>({...course,studentCount:studentIds?.length||0}))});return true;}
  if(route==='/api/teacher/class'&&req.method==='GET'){
    const course=await classFor(store,user,url.searchParams.get('id'));
    const students=(await Promise.all((course.studentIds||[]).map(async id=>{const student=await store.getUser(id);if(!student||roleOf(student)!=='student')return null;const grade=await store.getData('classGrades',course.id+'_'+id);return {id,fullName:student.fullName,schoolId:student.schoolId,grade:grade?.grade||'',feedback:grade?.feedback||''};}))).filter(Boolean);
    const [assignments,submissions,attendance,announcements]=await Promise.all(['classAssignments','classSubmissions','classAttendance','classAnnouncements'].map(name=>store.queryData(name,'classId',course.id)));
    json(res,200,{course,students,assignments,submissions,attendance,announcements});return true;
  }
  if(role==='teacher'&&req.method==='POST'){
    const data=await bodyOf(req),course=await classFor(store,user,data.classId);
    const base={classId:course.id,teacherId:user.id,updatedAt:Date.now()};
    if(['/api/teacher/grades','/api/teacher/attendance'].includes(route)){
      if(!validId(data.studentId)||!course.studentIds?.includes(data.studentId))throw fail(403,'This student is not enrolled in your class.');
      if(route.endsWith('/grades')){
        const grade=clean(data.grade,10);if(!/^(?:[1-4](?:\.\d{1,2})?|5(?:\.0{1,2})?|INC|DRP)$/.test(grade))throw fail(400,'Grade must be 1.00–5.00, INC, or DRP.');
        await store.setData('classGrades',course.id+'_'+data.studentId,{...base,studentId:data.studentId,grade,feedback:clean(data.feedback,1000)});json(res,200,{message:'Grade published.'});return true;
      }
      if(!validDate(data.date)||!['Present','Absent','Late','Excused'].includes(data.status))throw fail(400,'Enter a valid attendance date and status.');
      await store.setData('classAttendance',course.id+'_'+data.studentId+'_'+data.date,{...base,studentId:data.studentId,date:data.date,status:data.status});json(res,200,{message:'Attendance saved.'});return true;
    }
    if(route.endsWith('/assignments')){
      const title=clean(data.title,150),instructions=clean(data.instructions,5000);if(!title||!instructions||!validDate(data.dueDate))throw fail(400,'Complete the title, instructions and due date.');
      const id=crypto.randomUUID();await store.setData('classAssignments',id,{...base,title,instructions,dueDate:data.dueDate});json(res,201,{message:'Assignment published.',id});return true;
    }
    if(route.endsWith('/announcements')){
      const title=clean(data.title,150),body=clean(data.body,5000);if(!title||!body)throw fail(400,'Complete the title and announcement.');
      await store.setData('classAnnouncements',crypto.randomUUID(),{...base,title,body,category:'Academic',date:new Date().toISOString().slice(0,10)});json(res,201,{message:'Class announcement published.'});return true;
    }
  }
  if(route==='/api/student/classwork'&&req.method==='GET'){
    const courses=await studentCourses(store,user),assignments=[],announcements=[];
    for(const course of courses){for(const a of await store.queryData('classAssignments','classId',course.id)){const submission=await store.getData('classSubmissions',a.id+'_'+user.id);assignments.push({...a,courseName:course.name,submission:submission?{answer:submission.answer,submittedAt:submission.submittedAt}:null});}announcements.push(...await store.queryData('classAnnouncements','classId',course.id));}
    const ids=new Set(courses.map(c=>c.id));const attendance=(await store.queryData('classAttendance','studentId',user.id)).filter(a=>ids.has(a.classId));
    json(res,200,{courses,assignments,attendance,announcements});return true;
  }
  if(route==='/api/student/submissions'&&req.method==='POST'){
    const data=await bodyOf(req);if(!validId(data.assignmentId))throw fail(400,'Invalid assignment.');const a=await store.getData('classAssignments',data.assignmentId);if(!a)throw fail(404,'Assignment not found.');await classFor(store,user,a.classId);const answer=clean(data.answer,10000);if(!answer)throw fail(400,'Enter your response.');await store.setData('classSubmissions',data.assignmentId+'_'+user.id,{classId:a.classId,assignmentId:data.assignmentId,studentId:user.id,answer,submittedAt:Date.now()});json(res,200,{message:'Response submitted.'});return true;
  }
  throw fail(404,'Endpoint not found.');
}
module.exports={roleOf,homeOf,classesFor,studentCourses,rolesApi};
