'use client';
import {useEffect,useRef,useState} from 'react';
// Retry a failed visible menu image once; do not eagerly download offscreen art.
export default function GameImage({src,fallbackSrc,onError,onLoad,...props}){
 const ref=useRef(null),[attempt,setAttempt]=useState(0),[original,setOriginal]=useState(src);
 const current=original===src?attempt:0;
 const displayed=current===2&&fallbackSrc?fallbackSrc:current===1?src+(src.includes('?')?'&':'?')+'rvmkkRetry=1':src;
 useEffect(()=>{setOriginal(src);setAttempt(0);},[src]);
 useEffect(()=>{
  const element=ref.current;if(!element)return;let timer,visible=false;
  const retry=()=>{if(element.complete&&element.naturalWidth)return;setAttempt(n=>n<1?1:fallbackSrc&&n<2?2:n);};
  const start=()=>{if(visible)return;visible=true;if(!element.complete||!element.naturalWidth)timer=setTimeout(retry,12000);};
  const loaded=()=>clearTimeout(timer);element.addEventListener('load',loaded);
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))start();});
  if(observer)observer.observe(element);else start();
  return()=>{clearTimeout(timer);observer?.disconnect();element.removeEventListener('load',loaded);};
 },[src,current,fallbackSrc]);
 return <img {...props} ref={ref} src={displayed} onLoad={onLoad} onError={event=>{setAttempt(n=>n<1?1:fallbackSrc&&n<2?2:n);onError?.(event);}}/>;
}
