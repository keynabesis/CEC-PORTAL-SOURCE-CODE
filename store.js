const crypto = require('node:crypto');
const key = value => crypto.createHash('sha256').update(value.toLowerCase()).digest('hex');
class DemoStore {
  constructor() { this.users = new Map(); this.unique = new Map(); this.sessions = new Map(); this.documents = new Map(); }
  async createUser(user) {
    const keys = ['username','email','schoolId'].map(field => field + ':' + key(user[field]));
    if (keys.some(k => this.unique.has(k))) throw Object.assign(new Error('Account already exists.'), {status:409});
    this.users.set(user.id, structuredClone(user)); keys.forEach(k => this.unique.set(k,user.id)); return user;
  }
  async findUser(username) { const id = this.unique.get('username:' + key(username)); return id ? structuredClone(this.users.get(id)) : null; }
  async getUser(id) { return this.users.has(id) ? structuredClone(this.users.get(id)) : null; }
  async updateUser(id, data) { this.users.set(id,{...this.users.get(id),...structuredClone(data)}); }
  async setSession(token, data) { this.sessions.set(key(token),data); }
  async getSession(token) { const id=key(token);const session=this.sessions.get(id);if(session?.expires<Date.now()){this.sessions.delete(id);return null;}return session; }
  async deleteSession(token) { this.sessions.delete(key(token)); }
  async getData(collection,id) { return structuredClone(this.documents.get(collection+':'+id) || null); }
  async setData(collection,id,data) { this.documents.set(collection+':'+id,structuredClone(data)); }
}
DemoStore.prototype.queryData=async function(collection,field,value,array=false){return [...this.documents].filter(([id,data])=>id.startsWith(collection+':')&&(array?data[field]?.includes(value):data[field]===value)).map(([id,data])=>({...structuredClone(data),id:id.slice(collection.length+1)}));};
DemoStore.prototype.queryData=async function(collection,field,value,array=false){return [...this.documents].filter(([id,data])=>id.startsWith(collection+':')&&(array?data[field]?.includes(value):data[field]===value)).map(([id,data])=>({...structuredClone(data),id:id.slice(collection.length+1)}));};
module.exports={DemoStore,MySQLStore:require('./mysql-store').MySQLStore};

DemoStore.prototype.listClasses=async function(){return [...this.documents].filter(([k])=>k.startsWith('classes:')).map(([k,v])=>({...structuredClone(v),id:k.slice(8)}));};
DemoStore.prototype.enrollStudent=async function(uid,id){
 const all=[...this.documents].filter(([k])=>k.startsWith('classes:')).map(([k,v])=>({...v,id:k.slice(8)}));
 const c=all.find(c=>c.id===id),message=require('./subject-enrollment').reason(c,all,uid);
 if(message)throw Object.assign(new Error(message),{status:409});
 const {id:ignored,...data}=c;this.documents.set('classes:'+id,{...data,studentIds:[...(c.studentIds||[]),uid]});
};
