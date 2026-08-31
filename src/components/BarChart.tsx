import { money } from '../lib/format';

interface Point {
  label: string;
  value: number;
}

const BarChart = ({ data, format = 'number' }: { data: Point[]; format?: 'number' | 'money' }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="d-flex align-items-end gap-2" style={{ height: 180 }}>
      {data.map((d, i) => (
        <div key={i} className="flex-fill d-flex flex-column align-items-center" style={{ minWidth: 0 }}>
          <div
            className="w-100 rounded-top"
            style={{
              height: `${(d.value / max) * 140 + 4}px`,
              background: 'rgb(250, 165, 8)',
              transition: 'height .3s',
            }}
            title={format === 'money' ? money(d.value) : String(d.value)}
          />
          <small className="text-muted text-truncate w-100 text-center mt-1" style={{ fontSize: 10 }}>
            {d.label}
          </small>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
