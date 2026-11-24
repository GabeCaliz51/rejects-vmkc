import {ONLINE_VERSION,RemoteInput,cleanInput} from './OnlineProtocol.mjs';
export class OnlineRoom {
 constructor(client,{code,host,onChange=()=>{}}){this.client=client;this.code=code;this.host=host;this.onChange=onChange;this.id=crypto.randomUUID();this.remote=null;this.input=new RemoteInput();this.lastSeen=Date.now();this.sequence=0;this.stateSequence=-1;this.listeners=new Set();this.closed=false;this.config=null;this.connected=false;}
 async open(){
  if(!/^[A-F0-9]{16}$/.test(this.code))throw Error('Room codes contain 16 letters/numbers.');
  this.channel=this.client.channel('rvmkk-v1-'+this.code,{config:{broadcast:{self:false,ack:true}}});
  this.channel.on('broadcast',{event:'game'},({payload})=>this.receive(payload));
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Room connection timed out. Check your connection and try again.')),12000);this.channel.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timeout);this.connected=true;resolve();}else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){clearTimeout(timeout);this.connected=false;this.onChange({error:'Room connection interrupted.'});reject(Error('Could not connect to the online room.'));}});});
  this.heartbeat=setInterval(()=>{this.send('hello',{host:this.host});if(this.remote&&Date.now()-this.lastSeen>10000)this.notify({type:'disconnect'});},1000);
  await this.send('hello',{host:this.host});return this;
 }
 async send(type,data={}){if(this.closed||!this.channel)return;try{const result=await this.channel.send({type:'broadcast',event:'game',payload:{v:ONLINE_VERSION,from:this.id,to:this.remote,type,...data}});if(result!=='ok'&&!this.closed)this.onChange({error:'Network is slow. Reconnecting…'});}catch{if(!this.closed)this.onChange({error:'Connection interrupted. Reconnecting…'});}}
 receive(p){
  if(this.closed||p?.v!==ONLINE_VERSION||p.from===this.id||typeof p.from!=='string'||p.to&&p.to!==this.id)return;
  if(p.type==='hello'){
   if(this.host&&!p.host&&!this.remote){this.remote=p.from;this.send('accepted');this.onChange({peer:true});}
   else if(this.host&&this.remote===p.from){this.send('accepted');if(this.config)this.send('config',{config:this.config});}
   if(this.remote===p.from)this.lastSeen=Date.now();return;
  }
  if(p.type==='accepted'&&!this.host&&!this.remote){this.remote=p.from;this.onChange({peer:true});}
  if(p.from!==this.remote)return;
  this.lastSeen=Date.now();
  if(p.type==='input'&&this.host)this.input.accept(p);
  if(p.type==='config'&&!this.host){this.config=p.config;this.onChange({config:p.config});}
  if(p.type==='state'&&!this.host){if(p.state?.sequence>this.stateSequence){this.stateSequence=p.state.sequence;this.latestState=p.state;this.notify({type:'state',state:p.state});}}
  if(p.type==='choice'&&this.host)this.onChange({choice:p.fighter});
  if(p.type==='ready')this.onChange({ready:true});
  if(p.type==='start'){this.started=true;this.onChange({start:true});}
  if(['command','forfeit','disconnect'].includes(p.type))this.notify(p);
 }
 notify(event){for(const listener of this.listeners)listener(event);}
 listen(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 inputPacket(input){return this.send('input',{sequence:++this.sequence,input:cleanInput(input)});}
 setConfig(config){if(!this.host)return;this.config=config;this.send('config',{config});}
 async close(){if(this.closed)return;await this.send('disconnect');this.closed=true;clearInterval(this.heartbeat);this.listeners.clear();this.input.clear();if(this.channel)await this.client.removeChannel(this.channel);}
}
