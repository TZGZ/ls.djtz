import PublicHome from './public-home';
import {publicPackages} from './public-catalog';
export const dynamic='force-dynamic';
export default async function Home(){return <PublicHome packages={await publicPackages()}/>}
