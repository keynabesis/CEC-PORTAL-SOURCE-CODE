const crypto=require('node:crypto');
const tables={academics:'academic_records',preferences:'notification_preferences',enrollments:'enrollment_applications',reports:'support_reports',portal:'portal_content',classes:'classes',classGrades:'class_grades',classAttendance:'class_attendance',classAssignments:'class_assignments',classSubmissions:'class_submissions',classAnnouncements:'class_announcements'};
const digest=s=>crypto.createHash('sha256').update(s.toLowerCase()).digest('hex');
const decode=x=>typeof x==='string'?JSON.parse(x):x;
class MySQLStore {
  constructor(){this.pool=require('mysql2/promise').createPool({host:process.env.MYSQL_HOST||'127.0.0.1',port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,connectionLimit:10,charset:'utf8mb4',multipleStatements:false});}
  async listClasses(){const [rows]=await this.pool.execute('SELECT id,data FROM classes');return rows.map(r=>({...decode(r.data),id:r.id}));}
  async enrollStudent(uid,id){const c=await this.pool.getConnection();try{
    await c.beginTransaction();
    // Serialize enrollment changes across application instances, including empty catalogs.
    await c.execute("SELECT id FROM enrollment_lock WHERE id=1 FOR UPDATE");
    const [rows]=await c.execute('SELECT id,data FROM classes ORDER BY id FOR UPDATE');
    const all=rows.map(r=>({...decode(r.data),id:r.id})),course=all.find(c=>c.id===id);
    const message=require('./subject-enrollment').reason(course,all,uid);
    if(message)throw Object.assign(new Error(message),{status:409});
    const {id:ignored,...data}=course;data.studentIds=[...(course.studentIds||[]),uid];
    await c.execute('UPDATE classes SET data=? WHERE id=?',[JSON.stringify(data),id]);await c.commit();
  }catch(e){await c.rollback();throw e;}finally{c.release();}}
  async ready(){await this.pool.execute('SELECT id FROM users LIMIT 1');}
  async createUser(u){try{await this.pool.execute('INSERT INTO users (id,username,email,school_id,role,data) VALUES (?,?,?,?,?,?)',[u.id,u.username,u.email,u.schoolId,'student',JSON.stringify(u)]);}catch(e){if(e.code==='ER_DUP_ENTRY')throw Object.assign(new Error('Account already exists.'),{status:409});throw e;}return {...u,role:'student'};}
  unpack(row){return row?{...decode(row.data),id:row.id,username:row.username,email:row.email,schoolId:row.school_id,role:row.role}:null;}
  async findUser(username){const [rows]=await this.pool.execute('SELECT * FROM users WHERE username=?',[username]);return this.unpack(rows[0]);}
  async getUser(id){const [rows]=await this.pool.execute('SELECT * FROM users WHERE id=?',[id]);return this.unpack(rows[0]);}
  async updateUser(id,data){const connection=await this.pool.getConnection();try{await connection.beginTransaction();const [rows]=await connection.execute('SELECT * FROM users WHERE id=? FOR UPDATE',[id]);if(!rows.length)throw Error('Account missing');const u={...this.unpack(rows[0]),...data};await connection.execute('UPDATE users SET role=?,data=? WHERE id=?',[u.role,JSON.stringify(u),id]);await connection.commit();}catch(e){await connection.rollback();throw e;}finally{connection.release();}}
  async setSession(token,s){await this.pool.execute('INSERT INTO sessions (token_hash,user_id,expires) VALUES (?,?,?) ON DUPLICATE KEY UPDATE user_id=?,expires=?',[digest(token),s.uid,s.expires,s.uid,s.expires]);}
  async getSession(token){const [rows]=await this.pool.execute('SELECT user_id AS uid,expires FROM sessions WHERE token_hash=? AND expires>?',[digest(token),Date.now()]);return rows[0]||null;}
  async deleteSession(token){await this.pool.execute('DELETE FROM sessions WHERE token_hash=?',[digest(token)]);}
  table(collection){if(!tables[collection])throw Error('Unknown data collection');return tables[collection];}
  async getData(collection,id){const [rows]=await this.pool.execute('SELECT data FROM '+this.table(collection)+' WHERE id=?',[id]);return rows.length?decode(rows[0].data):null;}
  async setData(collection,id,data){const value=JSON.stringify(data);await this.pool.execute('INSERT INTO '+this.table(collection)+' (id,data) VALUES (?,?) ON DUPLICATE KEY UPDATE data=?',[id,value,value]);}
  async queryData(collection,field,value,array=false){if(!['teacherId','studentId','studentIds','classId'].includes(field))throw Error('Unknown query field');const query=array?'JSON_CONTAINS(data,?,?)':'JSON_UNQUOTE(JSON_EXTRACT(data,?))=?';const args=array?[JSON.stringify(value),'$.'+field]:['$.'+field,value];const [rows]=await this.pool.execute('SELECT id,data FROM '+this.table(collection)+' WHERE '+query,args);return rows.map(r=>({...decode(r.data),id:r.id}));}
}
module.exports={MySQLStore};
