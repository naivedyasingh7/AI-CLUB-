import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Suspense, lazy } from 'react';
import { BadgeArtwork } from './EventBadge';
const ActiveLanyard = lazy(()=>import('./InteractiveLanyard'));
import { Color, MathUtils } from 'three';
import gsap from 'gsap';
import { EVENT_CONFIG as C, galleryLayout } from './eventModel';

function StaticPass({ event, index, layout, palette, onSelect }) {
  const angle = index * layout.step;
  return <group position={[Math.sin(angle)*layout.radius,0,Math.cos(angle)*layout.radius]} rotation={[0,angle,0]}>
    <mesh position={[0,(C.railY + C.badgeY + 1.3)/2,0]}><boxGeometry args={[0.08,C.railY-C.badgeY-1.3,0.025]} /><meshStandardMaterial color={palette.text} roughness={0.9} /></mesh>
    <group position={[0,C.badgeY,0]} onClick={e=>{e.stopPropagation();onSelect(event.id);}}><BadgeArtwork event={event} palette={palette} /></group>
  </group>;
}
export default function EventsScene({ events, palette, progress, selection, onSelect, onSettled, visible, reduced, onDrag }) {
  const gallery = useRef();
  const { camera, invalidate } = useThree();
  const layout = galleryLayout(events.length);
  const metal = new Color(palette.bg).lerp(new Color(palette.text),0.19);
  useEffect(() => {
    const index = Math.max(0,events.findIndex(event=>event.id===selection.selectedId));
    const selecting = selection.mode === 'SELECTING';
    const returning = selection.mode === 'RETURNING';
    if (!selecting && !returning) return;
    const timeline = gsap.timeline({ onUpdate:invalidate, onComplete:()=>onSettled(returning?'RETURNED':'SETTLED') });
    timeline.to(gallery.current.rotation,{ y:selecting ? -index*layout.step : progress.current.angle, duration:reduced?0:C.selectionDuration, ease:'power2.inOut' },0)
      .to(camera.position,{ z:selecting?layout.radius+7.3:layout.radius+11, y:selecting?0.7:1.1, duration:reduced?0:C.selectionDuration, ease:'power2.inOut' },0);
    return ()=>timeline.kill();
  },[selection.mode,selection.selectedId,events,layout.step,layout.radius,camera,invalidate,onSettled,reduced,progress]);
  useFrame((_,delta)=>{
    if (!visible) return;
    if (selection.mode==='BROWSING') gallery.current.rotation.y = MathUtils.damp(gallery.current.rotation.y,progress.current.angle,6,delta);
    camera.lookAt(0,0.9,0);
  });
  const physicsActive = !reduced && ['INTERACTIVE','OPENING_DETAILS','DETAILS_OPEN','CLOSING_DETAILS'].includes(selection.mode);
  const selected = events.find(event=>event.id===selection.selectedId);
  return <>
    <color attach="background" args={[palette.bg]} /><fog attach="fog" args={[palette.bg,15,36]} />
    <ambientLight intensity={1.2} /><directionalLight position={[4,8,8]} intensity={3} color={palette.text} /><directionalLight position={[-5,2,4]} intensity={1.8} color={palette.text} />
    <group ref={gallery}>
      <mesh position={[0,C.railY,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[layout.radius,0.075,12,100]} /><meshStandardMaterial color={metal} metalness={0.85} roughness={0.32} /></mesh>
      {[0,Math.PI/2,Math.PI,Math.PI*1.5].map(angle=><mesh key={angle} position={[Math.sin(angle)*layout.radius,5.1,Math.cos(angle)*layout.radius]}><cylinderGeometry args={[0.018,0.018,3.8,6]} /><meshStandardMaterial color={metal} metalness={0.8} roughness={0.45} /></mesh>)}
      {events.filter(event=>!(physicsActive && event.id===selection.selectedId)).map(event=><StaticPass key={event.id} event={event} index={events.indexOf(event)} layout={layout} palette={palette} onSelect={onSelect} />)}
    </group>
    {physicsActive&&selected&&<Suspense fallback={<StaticPass event={selected} index={0} layout={layout} palette={palette} onSelect={()=>{}}/>}><ActiveLanyard event={selected} radius={layout.radius} palette={palette} paused={selection.mode!=='INTERACTIVE'||!visible} onDrag={onDrag}/></Suspense>}
    <mesh position={[0,-2.1,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[layout.radius+1.3,80]} /><meshStandardMaterial color={new Color(palette.bg).lerp(new Color(palette.text),0.025)} roughness={0.95} metalness={0.1} /></mesh>
  </>;
}
