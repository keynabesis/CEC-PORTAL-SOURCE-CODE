const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt);
const {DemoStore,MySQLStore}=require('./store');
const demo=require('./demo-data');
const {roleOf,homeOf,classesFor,studentCourses,rolesApi}=require('./roles');
const isDemo=process.argv.includes('--demo') || process.env.DATABASE_MODE==='demo';
const configured=Boolean(process.env.MYSQL_DATABASE && process.env.MYSQL_USER);
const store=isDemo?new DemoStore():configured?new MySQLStore():null;
const publicRoot=path.join(__dirname,'public');
const attempts=new Map();
const media={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
const fail=(status,message)=>Object.assign(new Error(message),{status});
const tokenOf=req=>(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('cec_session='))?.slice(12)||'';
async function userOf(req){const token=tokenOf(req);if(!token)throw fail(401,'Please log in.');const session=await store.getSession(token);if(!session||session.expires<=Date.now())throw fail(401,'Please log in.');const user=await store.getUser(session.uid);if(!user)throw fail(401,'Please log in.');return user;}
function publicUser(user){const {hash,salt,...safe}=user;return {...safe,role:roleOf(user),home:homeOf(user)};}
async function bodyOf(req){if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'Send JSON data.');let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>32768)throw fail(413,'Request too large.');}try{const data=JSON.parse(text);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw fail(400,'Invalid request.');}}
const text=(value,max=200)=>typeof value==='string'?value.trim().slice(0,max):'';
async function createAccount(data){
  const username=text(data.username,40),email=text(data.email,254).toLowerCase(),schoolId=text(data.schoolId,40),contact=text(data.contact,30);
  if(!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)||typeof data.password!=='string'||data.password.length<8||data.password.length>128)throw fail(400,'Use a 3–40 character username and an 8–128 character password.');
  if(data.password!==data.confirmPassword||!schoolId||!/^[+\d ()-]{7,30}$/.test(contact)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw fail(400,'Check your school ID, email, phone number, and matching passwords.');
  const salt=crypto.randomBytes(16).toString('hex');const hash=(await scrypt(data.password,salt,64)).toString('hex');
  return store.createUser({id:crypto.randomUUID(),username,email,schoolId,contact,salt,hash,role:'student',fullName:username,age:'',address:'',course:'',yearLevel:'',section:'',semester:'1st Semester',createdAt:Date.now()});
}
async function api(req,res,url){
  const route=url.pathname;
  if(route==='/api/config'&&req.method==='GET')return json(res,200,{mode:isDemo?'demo':configured?'mysql':'unconfigured'});
  if(route==='/api/college'&&req.method==='GET')return json(res,200,{name:'Cebu Eastern College',address:'Leon Kilat St., Cebu City',message:'Discover our story. Experience our community. Be part of our continuing legacy.'});
  if(!store)throw fail(503,'MySQL is not configured yet. Follow MYSQL-SETUP.md, or run npm run demo to preview locally.');
  if(['POST','PATCH','PUT','DELETE'].includes(req.method)){
    const origin=req.headers.origin;const allowed=process.env.APP_ORIGIN||`http://${req.headers.host}`;
    if(origin&&origin!==allowed)throw fail(403,'Invalid request origin.');
    if(req.headers['sec-fetch-site']==='cross-site')throw fail(403,'Cross-site requests are not allowed.');
  }
  if(['/api/signup','/api/login'].includes(route)&&req.method==='POST'){
    const ip=req.socket.remoteAddress;let rate=attempts.get(ip);if(!rate||rate.until<Date.now()){rate={count:0,until:Date.now()+60000};attempts.set(ip,rate);}if(++rate.count>20)throw fail(429,'Too many attempts. Please try again in a minute.');
    const data=await bodyOf(req);
    if(route==='/api/signup'){await createAccount(data);return json(res,201,{message:'Account created. You can now log in.'});}
    if(typeof data.username!=='string'||typeof data.password!=='string'||data.username.length>40||data.password.length>128)throw fail(400,'Check your username and password.');
    const user=await store.findUser(data.username.trim());const candidate=await scrypt(data.password,user?.salt||'nonexistent-user',64);
    if(!user||!crypto.timingSafeEqual(candidate,Buffer.from(user.hash,'hex')))throw fail(401,'Incorrect username or password.');
    const token=crypto.randomBytes(32).toString('hex');const remember=data.remember==='yes';const lifetime=remember?604800:3600;
    await store.setSession(token,{uid:user.id,expires:Date.now()+lifetime*1000});
    res.setHeader('Set-Cookie',`cec_session=${token}; HttpOnly; SameSite=Strict; Path=/${remember?'; Max-Age='+lifetime:''}${process.env.NODE_ENV==='production'?'; Secure':''}`);
    return json(res,200,{message:'Logged in successfully.',role:roleOf(user),home:homeOf(user)});
  }
  if(route==='/api/logout'&&req.method==='POST'){const token=tokenOf(req);if(token)await store.deleteSession(token);res.setHeader('Set-Cookie','cec_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{message:'Logged out.'});}
  const user=await userOf(req);
  const role=roleOf(user);
  if(await rolesApi({req,res,url,user,store,json,bodyOf}))return;
  if(role==='teacher'&&['/api/academics','/api/enrollment'].includes(route))throw fail(403,'Student access required.');
  if(route==='/api/profile'&&req.method==='GET')return json(res,200,publicUser(user));
  if(route==='/api/profile'&&req.method==='PATCH'){
    const data=await bodyOf(req);const updates={fullName:text(data.fullName,100),contact:text(data.contact,30),address:text(data.address,200),age:text(data.age,3)};
    if(!updates.fullName||!/^[+\d ()-]{7,30}$/.test(updates.contact)||updates.age&&!/^\d{1,3}$/.test(updates.age))throw fail(400,'Check your name, contact number, and age.');
    await store.updateUser(user.id,updates);return json(res,200,{message:'Profile updated.',...publicUser({...user,...updates})});
  }
  if(route==='/api/session'&&req.method==='GET')return json(res,200,{message:`Logged in as ${user.username}.`});
  if(route==='/api/academics'&&req.method==='GET'){
    const data=await store.getData('academics',user.id)||{courses:[],gpa:null,assignments:0,records:[],term:'Not assigned'};
    const managed=await studentCourses(store,user);if(managed.length){data.courses=managed;data.assignments=(await Promise.all(managed.map(c=>store.queryData('classAssignments','classId',c.id)))).flat().length;}
    return json(res,200,{...(data||{courses:[],gpa:null,assignments:0,records:[],term:'Not assigned'}),demo:isDemo});
  }
  if(route==='/api/announcements'&&req.method==='GET'){const data=await store.getData('portal','announcements');const courses=await classesFor(store,user);const items=(await Promise.all(courses.map(c=>store.queryData('classAnnouncements','classId',c.id)))).flat();return json(res,200,{items:[...(data?.items||[]),...items],demo:isDemo});}
  if(route==='/api/preferences'&&req.method==='GET')return json(res,200,await store.getData('preferences',user.id)||{announcements:true,assignments:true});
  if(route==='/api/preferences'&&req.method==='PUT'){const data=await bodyOf(req);if(typeof data.announcements!=='boolean'||typeof data.assignments!=='boolean')throw fail(400,'Invalid preferences.');await store.setData('preferences',user.id,{announcements:data.announcements,assignments:data.assignments});return json(res,200,{message:'Preferences saved.'});}
  if(route==='/api/enrollment'&&req.method==='GET')return json(res,200,await store.getData('enrollments',user.id)||{status:'Not submitted'});
  if(route==='/api/enrollment'&&req.method==='POST'){
    const data=await bodyOf(req);const saved={};for(const field of ['fullName','birthDate','gender','age','address','contact','email','guardian','relationship','guardianContact','lastSchool','yearLevel','course','studentType'])saved[field]=text(data[field]);
    if(!saved.fullName||!saved.birthDate||!saved.address||!saved.guardian||!saved.lastSchool||!saved.course||!saved.yearLevel||data.confirm!==true)throw fail(400,'Complete the required fields and confirmation.');
    if(!/^[+\d ()-]{7,30}$/.test(saved.contact)||!/^\S+@\S+\.\S+$/.test(saved.email))throw fail(400,'Enter a valid contact number and email.');
    await store.setData('enrollments',user.id,{...saved,status:'Submitted for review',submittedAt:Date.now()});return json(res,201,{message:'Enrollment information submitted for review. Submit supporting documents through your school office.'});
  }
  if(route==='/api/report'&&req.method==='POST'){const data=await bodyOf(req);const message=text(data.message,2000);if(message.length<10)throw fail(400,'Describe the issue in at least 10 characters.');await store.setData('reports',crypto.randomUUID(),{uid:user.id,message,createdAt:Date.now()});return json(res,201,{message:'Report saved for review.'});}
  throw fail(404,'Endpoint not found.');
}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname.startsWith('/api/'))return await api(req,res,url);
    if(!['GET','HEAD'].includes(req.method))throw fail(405,'Method not allowed.');
    if(url.pathname==='/dashboard.html'&&store&&tokenOf(req)){try{if(roleOf(await userOf(req))==='teacher'){res.writeHead(302,{Location:'/teacher.html'});res.end();return;}}catch(error){if(error.status!==401)throw error;}}
    const filename=path.resolve(publicRoot,'.'+(decodeURIComponent(url.pathname)==='/'?'/index.html':decodeURIComponent(url.pathname)));
    if(!filename.startsWith(publicRoot+path.sep))throw fail(403,'Forbidden.');
    const bytes=await fs.readFile(filename);res.writeHead(200,{'Content-Type':media[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(error){const status=error.status||(['ENOENT','EISDIR'].includes(error.code)?404:error instanceof URIError?400:500);json(res,status,{message:status===500?'Unable to complete your request. Check the server configuration.':error.message});}
});
setInterval(()=>{for(const [ip,rate]of attempts)if(rate.until<Date.now())attempts.delete(ip);},60000).unref();
async function start(){
  if(store?.ready)await store.ready();
  if(isDemo){
    const make=async(username,schoolId)=>createAccount({username,password:'Preview123!',confirmPassword:'Preview123!',schoolId,contact:'09123456789',email:username+'@example.test'});
    const student=await make('student.demo','DEMO-2026'),second=await make('student.two','DEMO-2027'),teacher=await make('teacher.demo','FACULTY-001'),other=await make('teacher.two','FACULTY-002');
    await store.updateUser(student.id,{fullName:'Charles Ashley Domin',course:'BSIT',yearLevel:'3rd Year',section:'Section 3',age:'20',address:'Cebu, Philippines'});
    await store.updateUser(second.id,{fullName:'Alex Reyes',course:'BSIT',yearLevel:'3rd Year',section:'Section 3'});
    await store.updateUser(teacher.id,{role:'teacher',fullName:'Maria Santos',department:'Information Technology'});
    await store.updateUser(other.id,{role:'teacher',fullName:'Daniel Cruz',department:'Information Technology'});
    for(const [i,c]of demo.courses.entries())await store.setData('classes','demo-class-'+(i+1),{...c,teacherId:i<3?teacher.id:other.id,studentIds:i<3?[student.id,second.id]:[student.id],section:'Section 3',term:'1st Semester · S.Y. 2026–2027'});
    const meetings=[[[2,540,630],[4,540,630]],[[2,630,720],[4,630,720]],[[5,780,870],[6,780,870]],[[1,750,840],[3,750,840]]];
    for(let i=0;i<4;i++){const id='demo-class-'+(i+1),c=await store.getData('classes',id);await store.setData('classes',id,{...c,capacity:30,enrollmentOpen:true,meetings:meetings[i].map(([day,start,end])=>({day,start,end}))});}
    const networking=await store.getData('classes','demo-class-4');
    await store.setData('classes','demo-network-evening',{...networking,studentIds:[],section:'Evening',days:'Monday & Wednesday',time:'5:00 PM – 6:30 PM',meetings:[{day:1,start:1020,end:1110},{day:3,start:1020,end:1110}]});
    await store.setData('academics',student.id,{courses:demo.courses,gpa:'1.74',records:demo.records,term:'1st Semester · S.Y. 2026–2027'});
    await store.setData('portal','announcements',{items:demo.announcements});
    await store.setData('classAssignments','demo-assignment',{classId:'demo-class-1',teacherId:teacher.id,title:'Professional ethics reflection',instructions:'Explain how professional ethics applies to a student information system.',dueDate:'2026-10-15',updatedAt:Date.now()});
  }
  server.listen(process.env.PORT||3000,process.env.HOST||'127.0.0.1',()=>console.log(`CEC portal: http://localhost:${process.env.PORT||3000} (${isDemo?'demo':configured?'MySQL':'MySQL not configured'})`));
}
start().catch(error=>{console.error(error.message);process.exitCode=1;});
