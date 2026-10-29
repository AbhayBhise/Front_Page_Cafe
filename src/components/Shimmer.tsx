import React from 'react';

interface ShimmerProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  className = '',
  style = {},
  width = '100%',
  height = '1rem',
  borderRadius = '8px',
}) => {
  return (
    <div
      className={`shimmer-placeholder ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

export const CafeCardSkeleton: React.FC = () => {
  return (
    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
      <Shimmer height={160} borderRadius={0} />
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Shimmer width="60%" height={22} borderRadius={6} />
          <Shimmer width="22%" height={20} borderRadius={12} />
        </div>
        <Shimmer width="45%" height={14} borderRadius={4} className="mb-3" />
        <Shimmer width="90%" height={12} borderRadius={4} className="mb-2" />
        <Shimmer width="75%" height={12} borderRadius={4} className="mb-3" />
        <div className="pt-2 border-top">
          <Shimmer width="40%" height={16} borderRadius={6} />
        </div>
      </div>
    </div>
  );
};

export const MenuItemSkeleton: React.FC = () => {
  return (
    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
      <Shimmer height={180} borderRadius={0} />
      <div className="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Shimmer width="65%" height={20} borderRadius={6} />
            <Shimmer width={16} height={16} borderRadius={4} />
          </div>
          <Shimmer width="95%" height={12} borderRadius={4} className="mb-2" />
          <Shimmer width="80%" height={12} borderRadius={4} className="mb-3" />
        </div>
        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
          <Shimmer width="30%" height={22} borderRadius={6} />
          <Shimmer width="35%" height={32} borderRadius={20} />
        </div>
      </div>
    </div>
  );
};

export const OrderCardSkeleton: React.FC = () => {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-3 mb-3" style={{ backgroundColor: '#ffffff' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <Shimmer width="40%" height={22} borderRadius={6} />
        <Shimmer width="20%" height={22} borderRadius={12} />
      </div>
      <Shimmer width="55%" height={14} borderRadius={4} className="mb-3" />
      <div className="p-3 bg-light rounded-3 mb-3">
        <Shimmer width="70%" height={14} borderRadius={4} className="mb-2" />
        <Shimmer width="50%" height={14} borderRadius={4} />
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <Shimmer width="30%" height={16} borderRadius={6} />
        <Shimmer width="25%" height={24} borderRadius={8} />
      </div>
    </div>
  );
};

export default Shimmer;

