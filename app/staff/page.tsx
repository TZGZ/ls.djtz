import {requireStaff} from '../staff-auth';
import {accessSignOutPath} from '../access-auth';
import StaffDashboard from '../staff-dashboard';
import {isStaffAdmin} from '../staff-membership';
export const dynamic='force-dynamic';
export const metadata={title:'Staff | DJ TZ',robots:{index:false,follow:false}};
export default async function StaffPage(){const user=await requireStaff();return <StaffDashboard userName={user.displayName} isAdmin={isStaffAdmin(user.email)} signOutUrl={accessSignOutPath('/staff/access')}/>}
