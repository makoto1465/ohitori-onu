const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const test=require('node:test');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/showStart\(\);\s*$/,'');
function runtime(){
  const elements=new Map();
  const element=()=>({hidden:true,dataset:{},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},addEventListener(){},querySelector(){return element();},querySelectorAll(){return [];},getBoundingClientRect(){return {left:0,top:0,width:100,height:100};},appendChild(){},focus(){},children:[],childNodes:[]});
  const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelector:()=>element(),querySelectorAll:()=>[],createElement:element,addEventListener(){},body:element(),activeElement:null};
  const ctx=vm.createContext({document,console,localStorage:{getItem(){return null;},setItem(){}},matchMedia:()=>({matches:true}),addEventListener(){},setTimeout(){return 1;},clearTimeout(){},requestAnimationFrame(){},cancelAnimationFrame(){},getComputedStyle:()=>({transform:'none'}),performance,Date,Math,Event:class{}});
  ctx.window={};
  vm.runInContext(code,ctx);
  vm.runInContext(`render=()=>{};flyPlay=()=>{};flyDraw=()=>{};flashSeal=()=>{};hideCoach=()=>{};paintLog=()=>{};hideArrow=()=>{};demoClear=()=>{};setIP=()=>{};
    function setup(hands,field='r5'){
      clearTimers(); G={seats:[0,1,2,3],pace:PACES.standard,dir:1,turn:0,phase:'turn',outLock:false,hold:false,held:[],logs:[],totals:[0,0,0,0],history:[],round:1,maxRounds:5,tips:new Set(),deck:buildDeck(),top:pc(field),pending:null,chain:null,lastPlay:null,canPass:false,tutorial:false};
      G.color=G.top.color;G.discard=[G.top];G.players=hands.map((h,i)=>({name:NAMES[i],human:i===0,hand:h.map(pc),onu:h.length===1,forgot:false,drew16:false}));
    }
  `,ctx);
  return {run:s=>vm.runInContext(s,ctx),ctx};
}
function check(name,source,expected){test(name,()=>{const r=runtime();assert.deepEqual(JSON.parse(JSON.stringify(r.run(source))),expected);});}
check('108 cards and card points',`[buildDeck().length,pts(pc('r9')),pts(pc('rS')),pts(pc('W4'))]`,[108,9,10,20]);
check('draw2 stacks across three turns',`setup([['rD','b8'],['bD','y8'],['gD','r8'],['b2','r8']]);for(let i=0;i<3;i++){G.phase='turn';play(i,[G.players[i].hand[0]],null);} [G.pending.n,G.turn]`,[3,3]);
check('wild draw4 stacks to sixteen',`setup([['W4','r8'],['W4','b8'],['W4','y8'],['W4','g8']]);for(let i=0;i<4;i++){G.phase='turn';play(i,[G.players[i].hand[0]],'r');}[G.pending.n,G.turn]`,[4,0]);
check('skip two cards returns to player',`setup([['rS','bS','r1'],['r2'],['r3'],['r4']]);play(0,G.players[0].hand.slice(0,2),null);G.turn`,0);
check('reverse even stays clockwise',`setup([['rR','bR','r1'],['r2'],['r3'],['r4']]);play(0,G.players[0].hand.slice(0,2),null);[G.dir,G.turn]`,[1,1]);
check('two separate reverse jumps apply both effects',`setup([['rR','r1'],['r2'],['r3'],['rR','r4']]);play(0,[G.players[0].hand[0]],null);doWarikomi(3,G.players[3].hand[0]);[G.dir,G.turn]`,[1,0]);
check('jump draw adds to unresolved penalty',`setup([['rD','r1'],['r2'],['rD','r3'],['r4']]);play(0,[G.players[0].hand[0]],null);doWarikomi(2,G.players[2].hand[0]);[G.pending.n,G.turn]`,[2,3]);
check('jump checks printed wild color and accepts new chosen color',`setup([['W','r1'],['W','r2'],['r3'],['r4']]);play(0,[G.players[0].hand[0]],'r');doWarikomi(1,G.players[1].hand[0],'b');[G.color,G.turn,G.players[1].hand.length]`,['b',2,1]);
check('illegal finish with symbol is blocked',`setup([['rS'],['r2'],['r3'],['r4']]);play(0,[G.players[0].hand[0]],null);[G.players[0].hand.length,G.phase]`,[1,'turn']);
check('cannot jump out with a symbol even declared',`setup([['rS'],['r2'],['r3'],['r4']],'rS');canJump(0,G.players[0].hand[0])`,false);
check('opening card can be specialed',`setup([['r2','y3'],['r2'],['r3'],['r4']]);canSpe(0)`,true);
check('self special is prohibited',`setup([['r2','y3'],['r2'],['r3'],['r4']]);G.lastPlay={by:0};canSpe(0)`,false);
check('special rejects symbol even when sum matches',`setup([['rS','r0'],['r2'],['r3'],['r4']],'bD');canSpe(0)`,false);
check('out of play rejects jump and special',`setup([['r2','y3'],['r5','b8'],['r3'],['r4']]);G.outLock=true;[canSpe(0),canJump(1,G.players[1].hand[0])]`,[false,false]);
check('pass stays out of play until next player plays',`setup([['r1'],['r2'],['r3'],['r4']]);G.canPass=true;closeAfterPass();beginTurn();[G.turn,G.phase,G.outLock,canSpe(0)]`,[1,'turn',true,false]);
check('sixteen requires exactly sixteen actually drawn',`setup([['r1'],['r2'],['r3'],['r4']]);drawCards(0,18);drawCards(1,16);G.deck=[];G.discard=[G.top];drawCards(2,16);G.players.map(p=>p.drew16)`,[false,true,false,false]);
check('recycling keeps the top card',`setup([['r1'],['r2'],['r3'],['r4']]);G.deck=[];const below=pc('b7');G.discard=[below,G.top];const got=drawCards(0,1);[cname(got[0]),G.discard.length,cname(G.discard[0])]`,['青7',1,'赤5']);
check('chain score matches supplied four player example',`setup([[],[],[],[]]);G.chain=[0,1,2,3];finish(3,'chain');G.totals`,[50,100,200,-200]);
check('ordinary and stacked finish bonus',`setup([['r5'],['r2'],['r3'],['r4']]);play(0,[G.players[0].hand[0]],null);const a=G.totals[0];setup([['r5','b5'],['r2'],['r3'],['r4']]);play(0,G.players[0].hand.slice(),null);[a,G.totals[0]]`,[-20,0]);
check('sixteen return doubles opponents hands',`setup([['r5'],['r2'],['r3'],['W']]);G.players[0].drew16=true;play(0,[G.players[0].hand[0]],null);G.totals`,[-40,4,6,40]);
check('break uses actual seating and direction',`setup([['r2'],[],['b1'],['r4']],'r5');G.seats=[0,2,3,1];G.chain=[1];G.phase='spe';[canBreak(0),canBreak(3)]`,[true,false]);
check('forgot ONU receives one card at next turn',`setup([['r5'],['r2'],['r3'],['r4']]);G.players[0].forgot=true;G.players[0].onu=false;beginTurn();[G.players[0].hand.length,G.players[0].forgot,G.canPass,G.outLock]`,[2,false,true,true]);
check('penalty draw allows pass without an extra draw',`setup([['r2'],['b1'],['r3'],['r4']],'yD');G.turn=1;G.pending={kind:'d2',n:2};forcedDraw();timers.find(t=>t.ms===900).fn();const count=G.players[1].hand.length;G.players[1].hand=Array.from({length:count},()=>pc('b1'));cpuTurn();[count,G.turn,G.players[1].hand.length,G.pending]`,[5,2,5,null]);
check('black draw cannot be mixed into draw2 stack',`setup([['W4','r2'],['b1'],['r3'],['r4']],'rD');G.pending={kind:'d2',n:1};!!validPlay(G.players[0].hand,[G.players[0].hand[0]])`,true);
check('duplicate stale play is harmless',`setup([['r5','r2'],['r3'],['r4'],['r6']]);const c=G.players[0].hand[0];play(0,[c],null);play(0,[c],null);G.discard.length`,2);
check('wrong player and malformed special are rejected',`setup([['r1','r2'],['r5','r3'],['r4'],['r6']]);play(1,[G.players[1].hand[0]],null);doSpe(0);[G.discard.length,G.players[0].hand.length,G.players[1].hand.length]`,[1,2,2]);
check('normal turn still permits reactions before anyone draws',`setup([['r2','y3'],['r5','r3'],['r4'],['r6']]);[canSpe(0),canJump(1,G.players[1].hand[0])]`,[true,true]);
check('stacked jump advances by both skip cards',`setup([['rS','bS','r1'],['r2'],['r3'],['r4']],'rS');doWarikomi(0,G.players[0].hand.slice(0,2));[G.turn,G.players[0].hand.length]`,[0,1]);
check('stacked jump can finish with numeric cards for zero points',`setup([['r5','b5'],['r2'],['r3'],['r4']]);doWarikomi(0,G.players[0].hand.slice());G.totals`,[0,2,3,4]);
check('repaint does not advance held tutorial',`setup([['b4','y2','g9'],['r2'],['r3'],['r4']],'r4');G.tutorial=true;G.tmode='intro';G.hold=true;let advanced=false;startSay=()=>{advanced=true;};tutStep();advanced`,false);
check('ONU counter chain follows actual conditions',`setup([['r2','b4'],['y1','g3'],['g1','b2'],['b2']],'r6');doSpe(0);speReturn(1);speReturn(2);speBreak(3);finishChain();G.totals`,[50,100,200,-200]);
test('120 seeded complete rounds conserve cards and finish',()=>{
  const r=runtime();
  const result=r.run(`
    let completed=0,maxMoves=0,wins=[0,0,0,0];
    const rng=Object.create(Math);let seed=717;rng.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    Math=rng;
    for(let round=0;round<120;round++){
      setup([[],[],[],[]]);G.deck=shuffle(buildDeck());
      for(let n=0;n<7;n++)for(const p of G.players)p.hand.push(G.deck.pop());
      while(true){G.top=G.deck.pop();if(!isSym(G.top))break;G.deck.unshift(G.top);}
      G.color=G.top.color;G.discard=[G.top];G.turn=round%4;G.players.forEach(p=>p.human=false);G.tutorial=false;
      beginTurn();let moves=0;
      while(G.phase!=='over'&&moves<5000){
        if(!timers.length)throw Error('No pending action '+G.phase);
        timers.sort((a,b)=>(a.start+a.ms)-(b.start+b.ms));const task=timers.shift();task.fn();moves++;
        const all=G.deck.concat(G.discard,...G.players.map(p=>p.hand));
        if(all.length!==108||new Set(all.map(c=>c.id)).size!==108)throw Error('Card conservation failed');
      }
      if(G.phase!=='over')throw Error('Round failed to finish');
      if(!G.history[0]||G.history[0].scores.some(x=>!Number.isFinite(x)))throw Error('Invalid scoring');
      completed++;wins[G.lastWinner]++;maxMoves=Math.max(maxMoves,moves);clearTimers();
    }
    ({completed,maxMoves,wins});
  `);
  assert.equal(result.completed,120);console.log('Simulation:',JSON.stringify(result));
});
module.exports={runtime};
