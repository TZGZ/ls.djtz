'use client';
import Showroom from './showroom';
export default function PublicHome({packages}:{packages:any[]}){
 return <div className="app storefront"><main><div className="content"><Showroom packages={packages} onDashboard={()=>window.location.assign('/staff/access')}/></div></main></div>
}
