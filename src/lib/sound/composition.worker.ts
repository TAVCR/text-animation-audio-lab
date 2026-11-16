import {renderComponent,type ComponentInput} from './composition';
self.onmessage=(event:MessageEvent<ComponentInput>)=>{
  const channels=renderComponent(event.data);
  self.postMessage(channels,{transfer:channels.map(c=>c.buffer)});
};
