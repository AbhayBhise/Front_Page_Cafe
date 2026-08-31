import { Link } from 'react-router-dom';
import type { Cafe } from '../types';

const CafeStatusBanner = ({ cafe }: { cafe: Cafe | null }) => {
  if (!cafe || cafe.status === 'approved') return null;

  if (cafe.status === 'pending') {
    return (
      <div className="alert alert-warning d-flex align-items-center gap-2">
        <i className="bi bi-hourglass-split fs-5" />
        <div>
          <strong>Your cafe is awaiting admin approval.</strong> You can build your menu and add staff
          now — customers will see you the moment you're approved.
        </div>
      </div>
    );
  }
  if (cafe.status === 'rejected') {
    return (
      <div className="alert alert-danger">
        <strong>Registration rejected.</strong> {cafe.rejectionReason || 'Contact support for details.'}{' '}
        <Link to="/owner/settings" className="alert-link">
          Update your details
        </Link>{' '}
        and it will be re-reviewed.
      </div>
    );
  }
  return (
    <div className="alert alert-dark">
      <strong>Your cafe is suspended.</strong> {cafe.rejectionReason || ''} Orders are disabled until an
      admin restores access.
    </div>
  );
};

export default CafeStatusBanner;
