import { Component, Suspense, lazy, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { events as configuredEvents } from '../../data/events';
import { EVENT_CONFIG as C, FALLBACK_POSTER, eventStatus, eventDateLabel, galleryLayout, interactionReducer } from './eventModel';
import './events.css';
const Scene = lazy(()=>import('./EventsScene'));
gsap.registerPlugin(ScrollTrigger);
class SceneBoundary extends Component {
  state = { failed:false };
  static getDerivedStateFromError() { return { failed:true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function usePreference(query) {
  const [matches,setMatches]=useState(()=>matchMedia(query).matches);
  useEffect(()=>{const media=matchMedia(query); const update=()=>setMatches(media.matches); media.addEventListener('change',update); return ()=>media.removeEventListener('change',update);},[query]);
  return matches;
}
export default function EventsSection({ events = configuredEvents }) {
  const section=useRef(null), progress=useRef({ angle:0 });
  const [selection,dispatch]=useReducer(interactionReducer,{mode:'BROWSING',selectedId:null});
  const [visible,setVisible]=useState(false);
  const reduced=usePreference('(prefers-reduced-motion: reduce)'), mobile=usePreference('(max-width: 767px)');
  const [palette]=useState(()=>{const css=getComputedStyle(document.documentElement);return {bg:css.getPropertyValue('--color-bg').trim(),text:css.getPropertyValue('--color-text').trim()};});
  const selected=events.find(event=>event.id===selection.selectedId);
  const settle=useCallback(type=>dispatch({type}),[]);
  useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:'120px'});observer.observe(section.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    if (events.length<3 || reduced || mobile) return;
    // Only this instance is owned here. Existing horizontal/section triggers survive.
    const trigger=ScrollTrigger.create({id:'events-archive',trigger:section.current,start:'top top',end:`+=${Math.min(C.maximumPin,events.length*C.galleryScrollPerEvent)}`,pin:section.current.querySelector('.events-shell'),invalidateOnRefresh:true,onUpdate:self=>{if(selection.mode==='BROWSING')progress.current.angle=-self.progress*Math.PI*2*(events.length-1)/events.length;}});
    return()=>trigger.kill();
  },[events.length,reduced,mobile,selection.mode]);
  const choose=id=>{ if(selection.mode==='BROWSING')dispatch({type:'SELECT',id}); };
  const fallback=<div className="events-fallback"><img src={selected?.poster||events[0]?.poster||FALLBACK_POSTER} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=FALLBACK_POSTER;}} alt="AI Club development preview pass"/><p>A collection of moments, made together.</p></div>;
  return <section ref={section} className="events-archive" id="events" aria-labelledby="events-heading" data-mode={selection.mode}>
    <div className="events-shell">
      <header className="events-heading"><div className="events-eyebrow"><span>AI CLUB / VIT BHOPAL</span><span>THE EVENT ARCHIVE</span></div><h2 id="events-heading">Good things<br/><span>bring us together.</span></h2><div className="events-intro"><span className="events-index">[ E / 01 ]</span><p>A pass to the next possibility.<br/>Choose a lanyard. Step inside.</p></div></header>
      {events.length ? <>
        <div className="events-stage" aria-label="Suspended event pass gallery">
          <div className="events-stage-label"><span>PASS ARCHIVE</span><span>{String(events.length).padStart(2,'0')} {events.length===1?'ENTRY':'ENTRIES'}</span></div>
          <SceneBoundary fallback={fallback}><Suspense fallback={fallback}><Canvas aria-hidden="true" dpr={[1,C.dpr]} frameloop={visible&&!reduced?'always':'demand'} camera={{position:[0,1.1,galleryLayout(events.length).radius+11],fov:C.cameraFov}} gl={{antialias:true,alpha:false,powerPreference:'low-power'}} onCreated={({gl})=>{gl.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();gl.domElement.parentElement.dataset.contextLost='true';},{once:true});}}><Scene events={events} palette={palette} progress={progress} selection={selection} onSelect={choose} onSettled={settle} visible={visible} reduced={reduced}/></Canvas></Suspense></SceneBoundary>
          <div className="events-stage-footer"><span>{selection.mode==='BROWSING'?'SELECT A PASS TO ENTER':'YOUR PASS. YOUR PERSPECTIVE.'}</span><span>↗</span></div>
        </div>
        <div className="events-bottom"><div className="events-event-list" aria-label="Choose an event">{events.map((event,index)=><button key={event.id} onClick={()=>choose(event.id)} disabled={selection.mode!=='BROWSING'}><span className="events-list-number">{String(index+1).padStart(2,'0')}</span><span><small>{eventStatus(event)}</small><strong>{event.title}</strong><span>{eventDateLabel(event)}</span></span><span className="events-list-arrow">↗</span></button>)}</div><p className="events-note">Every gathering starts<br/>with an idea. This one<br/>is still taking shape.</p></div>
        {selected&&<div className="events-selection-controls"><span aria-live="polite">{selection.mode==='SELECTING'?'Bringing your pass into view…':selected.title}</span><button className="events-text-button" onClick={()=>dispatch({type:selection.mode==='SELECTING'?'CANCEL':'RETURN'})}>Return to archive ↗</button></div>}
      </> : <p className="events-empty">The archive is open. Events will appear here when announced.</p>}
    </div>
  </section>;
}
