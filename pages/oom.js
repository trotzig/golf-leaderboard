import OrderOfMeritPage from '../src/OrderOfMeritPage.js';
import getCollidingSlugs from '../src/getCollidingSlugs.mjs';

export default OrderOfMeritPage;

export async function getServerSideProps() {
  const collidingSlugs = await getCollidingSlugs();
  return { props: { collidingSlugs: [...collidingSlugs] } };
}
