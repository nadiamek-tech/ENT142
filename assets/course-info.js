/* ENT 142 · course settings for the course portal (assets/portal.js).
   To update the site, edit only this file. Empty links show "coming soon" until you paste them. */
window.COURSE={
  code:'ENT 142', title:['Innovation &','Entrepreneurship 2'], eyebrow:'ENT 142 · Fall 2026 · Lab · on campus',
  instructor:'Eng. Nadia Mek',
  nav:[
    {key:'lectures',label:'Lectures',href:'lectures.html',icon:'lectures',blurb:'Each week: the lab topic, real examples, your project work.'},
    {key:'project',label:'Project',href:'project-1.html',icon:'project',blurb:'The report explained, one page per section, with an example.'},
    {key:'present',label:'Presentation',href:'presentation.html',icon:'present',blurb:'Your minute, slides, voice and the questions.'}
  ],
  assessPage:'project-1.html', assessLabel:'Project',
  onlineAnswer:'No. Classes are on campus, in the lab, with your team. This site supports your classes: lab notes, the project guide and dates.',

  links:{
    reg:(window.ENT142_REG||'https://forms.cloud.microsoft/r/B905PpvTTv'),   /* team registration (Microsoft Form, CUD account) */
    booking:'',
    moodle:''
  },

  ask:()=>window.ENT142Assistant&&ENT142Assistant.open(),
  search:q=>{ const A=window.ENT142Assistant; if(!A||!A.search) return []; const r=A.search(q);
    return r.kb.slice(0,3).map(x=>({t:x.e.q,s:x.e.a,l:x.e.l})).concat(r.idx.slice(0,4).map(x=>({t:x.e.pt+' · '+x.e.n,s:x.e.t,l:x.e.l}))); },

  /* assessments (syllabus). date = Dubai time; time:false hides the clock time. submit.link = Moodle submission, '' = coming soon */
  assess:[
    {id:'a1',name:'Activity 1',short:'Activity 1',type:'Activity',weight:'10%',when:'Week 6',covers:['In-class activity','Requirements published later'],format:'In class'},
    {id:'p1',name:'Project 1 · Social Enterprise Report',short:'P1 Report',type:'Project',weight:'40%',date:'2026-10-27T09:00:00+04:00',time:false,
      covers:['Group report, 4000 words, one Word file','Executive summary, introduction and seven sections','Verified open data and your prototype test'],format:'Team of 4–5',clos:'1, 3',
      submit:{link:'',due:'2026-10-27T23:59:00+04:00',dueText:'Tue 27 Oct'},revise:[['Project guide','project-1.html'],['Report Lab','report-lab.html']]},
    {id:'p1p',name:'Project 1 · Presentation',short:'P1 Presentation',type:'Project',weight:'10%',date:'2026-10-27T09:00:00+04:00',time:false,
      covers:['1 minute each + 2 minutes Q&A per team','PowerPoint, same day as the report'],format:'Team, graded individually',clos:'2',
      revise:[['Presentation tips','presentation.html']]},
    {id:'a2',name:'Activity 2 · Video pitch',short:'Activity 2',type:'Activity',weight:'10%',when:'Week 13',covers:['30–45 second video pitch','Requirements published later'],format:'Individual',clos:'2'},
    {id:'p2',name:'Project 2 · Reflective Portfolio',short:'Project 2',type:'Project',weight:'30%',when:'Week 16',covers:['Individual reflective portfolio','Requirements published later'],format:'Individual',clos:'4'}
  ],

  /* semester calendar: lec = [title, link] (no link = in preparation) */
  weeks:[
    {w:'1', lec:['Overview of the Course','week-01.html']},
    {w:'2', lec:['Idea Selection and Evaluation','week-02.html']},
    {w:'3', lec:['Lean Startups','week-03.html']},
    {w:'4', lec:['Sustainable Innovation and Entrepreneurship','week-04.html']},
    {w:'5', lec:['Prototyping','week-05.html']},
    {w:'6', lec:'Industry Barriers', ev:['a1']},
    {w:'7', lec:'Lean Model Canvas'},
    {w:'8', lec:'Pitching Workshop'},
    {w:'9', lec:'Presenting the Idea', ev:['p1','p1p']},
    {w:'10', lec:'Reflection Workshop'},
    {w:'11', lec:'Reflection and Reflective Assessment'},
    {w:'12', lec:'Elevator Pitch'},
    {w:'13', lec:'Elevator Pitch Workshop (Part 1)', ev:['a2']},
    {w:'14', lec:'Elevator Pitch Workshop (Part 2)'},
    {w:'15', lec:'Course Reflection (Part 1)'},
    {w:'16', lec:'Course Reflection (Part 2)', ev:['p2']}
  ],

  clos:[
    ['CLO 1','Explain the process of innovation, entrepreneurship and sustainability.'],
    ['CLO 2','Apply skills required for effective teamwork and presentations, emphasizing sustainable approaches to solving real-life social issues through innovation.'],
    ['CLO 3','Analyze the impact of innovation, entrepreneurship and sustainability on society and the economy.'],
    ['CLO 4','Articulate the value of innovation, entrepreneurship, and sustainability in shaping own career paths focusing on continuous learning and personal development.']
  ],

  faqExtra:[
    ['What is Project 1?','A team report (4000 words) that turns your idea into a social enterprise and proves it with real data and a tested prototype. <a href="project-1.html">See the project guide, one section per page →</a>'],
    ['How do we register our team?','One person registers the whole team with the <a href="project-1.html#s2">Microsoft Form</a>, using a CUD account.'],
    ['Do we need a survey or interviews?','No. Your evidence is verified open data plus your own prototype test.'],
    ['Which prototype should we build?','Use the <a href="week-05.html#s3">Prototype Helper</a> in Week 5.'],
    ['Can I use ChatGPT or AI as a source?','No. Chatbots can invent numbers. Find the figure on the original publisher’s page and cite that.']
  ]
};
