import { getImageUrl } from '../services/api.js';
import { HiOutlineCheckCircle } from 'react-icons/hi';

const FoodCard = ({ item, onAddItem }) => {
  if (item.isMixMatch) {
    return (
      <button
        type="button"
        onClick={() => onAddItem(item)}
        className="flex h-full min-h-[225px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-green-500 bg-green-50 transition hover:border-green-600 hover:bg-green-100 hover:shadow-lg sm:min-h-[270px] lg:min-h-[290px]"
      >
        <HiOutlineCheckCircle className="mb-2 h-12 w-12 text-green-600" />
        <h3 className="text-center text-lg font-bold text-green-800 sm:text-xl">Mix &amp; Match</h3>
        <p className="mt-2 text-center text-sm font-semibold text-green-700">Pick 2 Rice Meals – ₱158</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onAddItem(item)}
      className="flex h-full min-h-[225px] flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:shadow-lg active:scale-100 sm:min-h-[270px] lg:min-h-[290px]"
    >
      <img
        src={getImageUrl(item.image)}
        alt={item.name}
        className="h-28 w-full object-cover sm:h-40"
      />
      <div className="space-y-1 p-3 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 sm:text-xs">{item.category}</p>
        <h3 className="text-base font-bold text-slate-800 sm:text-lg">{item.name}</h3>
        <p className="text-sm font-semibold text-slate-700 sm:text-base">PHP {Number(item.price).toFixed(2)}</p>
      </div>
    </button>
  );
};

export default FoodCard;
