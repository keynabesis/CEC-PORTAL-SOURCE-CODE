const fail=(status,message)=>Object.assign(new Error(message),{status});
const validMeetings=c=>Array.isArray(c.meetings)&&c.meetings.length>0&&c.meetings.every(m=>Number.isInteger(m.day)&&m.day>=1&&m.day<=7&&Number.isInteger(m.start)&&Number.isInteger(m.end)&&m.start>=0&&m.end<=1440&&m.start<m.end);
function reason(course,all,uid){
 if(!course)return 'Class not found.';
 if(course.studentIds?.includes(uid))return 'You are already enrolled in this schedule.';
 if(course.enrollmentOpen!==true)return 'Enrollment is closed for this class.';
 if(!course.code||!course.term||!validMeetings(course))return 'This class schedule is not ready for enrollment.';
 if(!Number.isInteger(course.capacity)||course.capacity<=0)return 'Class capacity has not been configured.';
 if((course.studentIds||[]).length>=course.capacity)return 'This class is full.';
 const current=all.filter(c=>c.term===course.term&&c.studentIds?.includes(uid));
 if(current.some(c=>c.code.trim().toLowerCase()===course.code.trim().toLowerCase()))return 'You are already enrolled in this subject for this term.';
 if(current.some(c=>!validMeetings(c)))return 'Ask the school to complete your existing timetable before enrolling.';
 if(current.some(c=>c.meetings.some(a=>course.meetings.some(b=>a.day===b.day&&a.start<b.end&&b.start<a.end))))return 'This schedule overlaps with one of your enrolled classes.';
 return '';
}
async function enrollmentApi({req,res,url,user,store,json,bodyOf}){
 if(!['/api/student/subjects','/api/student/enroll'].includes(url.pathname))return false;
 if((user.role||'student')!=='student')throw fail(403,'Student access required.');
 if(req.method==='GET'&&url.pathname.endsWith('/subjects')){
  const all=await store.listClasses();const items=await Promise.all(all.filter(c=>c.enrollmentOpen===true||c.studentIds?.includes(user.id)).map(async c=>({id:c.id,name:c.name,code:c.code,section:c.section,term:c.term,days:c.days,time:c.time,room:c.room,units:c.units,teacher:(await store.getUser(c.teacherId))?.fullName||'Instructor',availableSeats:Math.max(0,(c.capacity||0)-(c.studentIds||[]).length),enrolled:!!c.studentIds?.includes(user.id),unavailable:reason(c,all,user.id)})));
  json(res,200,{items});return true;
 }
 if(req.method==='POST'&&url.pathname.endsWith('/enroll')){const data=await bodyOf(req);if(typeof data.classId!=='string'||!/^[\w-]{1,128}$/.test(data.classId))throw fail(400,'Choose a valid schedule.');await store.enrollStudent(user.id,data.classId);json(res,201,{message:'Enrolled successfully. Your dashboard and timetable are updated.'});return true;}
 throw fail(405,'Method not allowed.');
}
module.exports={reason,enrollmentApi};
