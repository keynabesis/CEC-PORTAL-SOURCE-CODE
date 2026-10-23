// Demonstration records only. Never written to a live Firebase database automatically.
const courses=[
  {name:'Social and Professional Issues',code:'IT SPI31',teacher:'Ms. Sodoro',days:'Tuesday & Thursday',time:'9:00 AM – 10:30 AM',room:'C1-4',units:3,grade:'Pending'},
  {name:'System Integration and Architecture',code:'IT SIA31',teacher:'Mr. Becari',days:'Tuesday & Thursday',time:'10:30 AM – 12:00 PM',room:'CL 0',units:3,grade:'Pending'},
  {name:'Event Driven Programming',code:'IT EVD31',teacher:'Mr. Prado',days:'Friday & Saturday',time:'1:00 PM – 2:30 PM',room:'CL 1',units:3,grade:'Pending'},
  {name:'Networking',code:'IT NET31',teacher:'Mr. Villanueva',days:'Monday & Wednesday',time:'12:30 PM – 2:00 PM',room:'C1-3',units:1,grade:'Pending'}
];
const records=[
  ['2.0','GE 1','PURPOSIVE COMMUNICATION',3,3,0],['1.6','GE ELEC 1','MASINING NA PAMAMAHAYAG',3,3,0],['1.9','GE ELEC 2','GENDER AND SOCIETY',3,3,0],['2.9','GE ELEC 3','ENVIRONMENTAL SCIENCE',3,3,0],['2.8','IT CP11','COMPUTER PROGRAMMING 1',3,2,1],['1.9','IT IC11','INTRODUCTION TO COMPUTING',3,3,0],['2.1','PATHFIT 1','MOVEMENT COMPETENCY TRAINING',2,2,0],['1.6','NSTP 1','NATIONAL SERVICE TRAINING PROGRAM 1',3,3,0]
];
const announcements=[
  {title:'Enrollment for the new semester',category:'Important',date:'2026-09-13',body:'Review your enrollment information and prepare your requirements before submitting your application.'},
  {title:'Student orientation',category:'Academic',date:'2026-09-14',body:'Welcome to the new academic year. Check the student portal regularly for official schedules.'},
  {title:'Campus activities',category:'Event',date:'2026-09-16',body:'Discover student organizations and upcoming campus activities.'},
  {title:'Library services',category:'General',date:'2026-09-17',body:'Explore the learning resources available to the college community.'},
  {title:'Class schedule reminders',category:'Important',date:'2026-09-18',body:'Review your timetable and classroom assignments before attending your classes.'},
  {title:'Student support',category:'General',date:'2026-09-19',body:'Contact the appropriate college office for assistance with your student records.'}
];
module.exports={courses,records,announcements};
