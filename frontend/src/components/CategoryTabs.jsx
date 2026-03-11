const CategoryTabs = ({ categories, activeCategory, onSelectCategory }) => {
  return (
    <div className="mb-2 flex gap-2 overflow-x-auto pb-2 sm:mb-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
            activeCategory === category
              ? 'bg-amber-500 text-white shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
          type="button"
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
