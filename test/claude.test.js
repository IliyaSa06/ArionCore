const http=require('http');
const assert=require('assert');
let calls=[];
const sse=(res,events)=>{res.writeHead(200,{'content-type':'text/event-stream'});events.forEach(([e,d])=>res.write('event: '+e+'\r\ndata: '+JSON.stringify(d)+'\r\n\r\n'));res.end()};
const srv=http.createServer((req,res)=>{
  let b='';req.on('data',c=>b+=c);req.on('end',()=>{
    if(req.headers['x-api-key']==='bad'){res.writeHead(401,{'content-type':'application/json'});return res.end(JSON.stringify({error:{message:'invalid x-api-key'}}))}
    const body=JSON.parse(b);calls.push({headers:req.headers,body});
    if(calls.length===1){
      sse(res,[
       ['message_start',{type:'message_start',message:{}}],
       ['content_block_start',{index:0,content_block:{type:'text',text:''}}],
       ['content_block_delta',{index:0,delta:{type:'text_delta',text:'Look'}}],
       ['content_block_delta',{index:0,delta:{type:'text_delta',text:'ing'}}],
       ['content_block_stop',{index:0}],
       ['content_block_start',{index:1,content_block:{type:'tool_use',id:'tu_1',name:'highlight_part',input:{}}}],
       ['content_block_delta',{index:1,delta:{type:'input_json_delta',partial_json:'{"part":'}}],
       ['content_block_delta',{index:1,delta:{type:'input_json_delta',partial_json:'"vrm"}'}}],
       ['content_block_stop',{index:1}],
       ['message_delta',{delta:{stop_reason:'tool_use'}}],['message_stop',{}]]);
    } else {
      sse(res,[
       ['content_block_start',{index:0,content_block:{type:'text',text:''}}],
       ['content_block_delta',{index:0,delta:{type:'text_delta',text:'Done.'}}],
       ['content_block_stop',{index:0}],
       ['message_delta',{delta:{stop_reason:'end_turn'}}],['message_stop',{}]]);
    }
  });
});
srv.listen(0,async()=>{
  process.env.ANTHROPIC_BASE_URL='http://127.0.0.1:'+srv.address().port;
  const {runChat}=require('../claude.js');
  const deltas=[];const tools=[];
  const r=await runChat({key:'k',model:'m',system:'s',messages:[{role:'user',content:'hi'}],tools:[{name:'highlight_part',description:'d',input_schema:{type:'object'}}],maxTokens:100,signal:new AbortController().signal,onText:t=>deltas.push(t),runTool:async u=>{tools.push(u);return {content:'ok '+u.input.part}}});
  assert.strictEqual(r.text,'Looking\n\nDone.');
  assert.deepStrictEqual(tools[0].input,{part:'vrm'});
  assert.strictEqual(calls[0].headers['x-api-key'],'k');
  assert.strictEqual(calls[0].headers['anthropic-version'],'2023-06-01');
  const m2=calls[1].body.messages;
  assert.strictEqual(m2[1].role,'assistant');assert.strictEqual(m2[2].content[0].tool_use_id,'tu_1');assert.strictEqual(m2[2].content[0].content,'ok vrm');
  assert.strictEqual(deltas.join(''),'Looking\n\nDone.');
  let err;try{await runChat({key:'bad',model:'m',system:'s',messages:[{role:'user',content:'x'}],tools:[],maxTokens:10,signal:new AbortController().signal,onText(){},runTool:async()=>({content:''})})}catch(e){err=e}
  assert.strictEqual(err.code,'invalid_key');
  const ac=new AbortController();ac.abort();let e2;try{await runChat({key:'k',model:'m',system:'s',messages:[{role:'user',content:'x'}],tools:[],maxTokens:10,signal:ac.signal,onText(){},runTool:async()=>({content:''})})}catch(e){e2=e}
  assert.strictEqual(e2.code,'cancelled');
  console.log('claude.js OK: stream+tool loop+errors');srv.close();
});
