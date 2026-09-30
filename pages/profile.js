import ProfilePage from '../src/ProfilePage.js';
import profileProps from '../src/profileProps.js';

export default ProfilePage;

export function getServerSideProps({ req, res }) {
  return profileProps({ req, res });
}
