export type Composition={
  version:1;gesture:'travel'|'fracture'|'flight'|'elastic'|'contact'|'orbit';concept:string;
  intent:'precise'|'expansive'|'unstable';spectrum:'focus'|'bloom'|'fracture';
  space:'center'|'travel'|'diffuse';ending:'dry'|'decay';
  synthesis:'filtered'|'modal'|'carrier';envelope:'snap'|'swell'|'flutter';relation:'follow'|'answer';
  intensity:number;complexity:number;depth:number;response:number
};
export type ComponentInput={
  channels:Float32Array[]; plan:Composition; peak:number; span:number;
  travel:number; position:number; seed:number; role:string; speed:number
};

// The source peak remains the pitch pivot. All component envelopes reference
// this same point, including on partially visible or reversed gestures.
export function renderComponent(input:ComponentInput):Float32Array[]{
  const {channels,plan,peak}=input;
  const {intensity,complexity,depth,response,gesture}=plan;
  const strike=gesture==='elastic'||gesture==='contact';
  const broken=gesture==='fracture';
  const span=Math.max(480,Math.min(76800,input.span*1600));
  const speed=Math.max(.2,Math.min(3,input.speed));
  const carrier=gesture==='contact'?82:gesture==='elastic'?370:broken?166:125;
  const sourceLength=channels[0].length;
  const ring=plan.ending==='dry'?0:Math.round(48000*depth*(strike ? .12 : .22));
  const result=[new Float32Array(sourceLength+ring),new Float32Array(sourceLength+ring)];
  const direction=(input.seed%2?1:-1)*(gesture==='orbit'?-1:1);
  const drive=1+intensity*(plan.intent==='expansive'?2.4:1.5);
  const detail=complexity*(input.role==='Movimiento'?1:.62);
  const baseWidth=plan.space==='center' ? .06 : plan.space==='travel' ? .58 : .80;
  const cutoff=plan.spectrum==='focus'?3200:plan.spectrum==='bloom'?1700:2600;
  const rough=plan.spectrum==='fracture'||broken;
  const before=Math.max(240,Math.min(span,input.travel*1600||span*.35));
  const decay=plan.envelope==='snap' ? .20 : plan.envelope==='swell' ? .72 : .38;
  const answering=input.role!=='Movimiento' && plan.relation==='answer';
  for(let c=0;c<2;c++){
    const source=channels[Math.min(c,channels.length-1)];
    const other=channels[Math.min(1-c,channels.length-1)];
    const out=result[c];
    const delay=Math.round(48000*(.013+depth*.011+c*.007));
    let low=0,slow=0,phase=0,previous=0;
    for(let i=0;i<out.length;i++){
      const delta=i-peak;
      const energy=Math.exp(-Math.abs(delta)/(delta<0?before:span*decay));
      const travel=Math.tanh(delta/span*2.8);
      const contour=energy*response;
      const pitchDrift=(strike ? .095 : .027)*detail*contour;
      const read=Math.max(0,Math.min(sourceLength-1,i+delta*pitchDrift));
      const j=Math.floor(read);
      const mono=(source[j]+other[j])*.5;
      const dry=i<sourceLength?source[i]:0;
      const sample=i<sourceLength?source[j]+(source[Math.min(j+1,sourceLength-1)]-source[j])*(read-j):0;
      const hz=Math.min(16500,cutoff+(3500+intensity*6300)*contour*Math.sqrt(speed));
      low+=(1-Math.exp(-2*Math.PI*hz/48000))*(sample-low);
      slow+=.038*(low-slow);
      const transient=low-previous;previous=low;
      const saturated=Math.tanh(drive*(low+.40*(low-slow)))/Math.tanh(drive);
      phase+=2*Math.PI*carrier*(1+.37*contour+input.position*.14)/48000;
      const fm=Math.sin(phase+detail*Math.sin(phase*2.03));
      const modulation=rough || plan.synthesis==='carrier'?1-detail*.58*(1-fm*fm):1;
      const chops=plan.envelope==='flutter' ? 1-.55*detail*Math.pow(Math.sin(4*Math.PI*delta/span),4) : 1;
      const articulation=answering ? .50+.50*(1-energy) : 1;
      const direct=chops*articulation*(.33*dry+.67*saturated*modulation)*(1-.17*depth);
      const resonant=plan.synthesis==='modal' && delta>=0?detail*.20*fm*Math.exp(-delta/(span*.26))*Math.min(1,delta/150):0;
      const side=(sample-mono)*Math.min(.38,depth*.4);
      const pan=direction*baseWidth*depth*(travel*response+.24*(input.position-.5));
      const gain=Math.sqrt(1+(c===0?-pan:pan));
      const reflection=ring && i>=delay?out[i-delay]*depth*(plan.space==='diffuse' ? .24 : .16):0;
      out[i]=(gain*(direct+side+resonant+transient*intensity*.09)+reflection)*Math.min(1,(out.length-i-1)/120);
    }
  }
  return result;
}
