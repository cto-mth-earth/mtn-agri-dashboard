export default function MetricsDisplay({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
        <div className="text-sm text-gray-500">Total Crops</div>
        <div className="text-2xl font-bold text-gray-800">
          {metrics.totalCrops}
        </div>
        <div className="text-xs text-gray-500">
          {metrics.totalRecords} records across {metrics.totalSeasons} seasons
        </div>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
        <div className="text-sm text-gray-500">Total Districts</div>
        <div className="text-2xl font-bold text-gray-800">
          {metrics.totalDistricts}
        </div>
        <div className="text-xs text-gray-500">Districts in the state</div>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
        <div className="text-sm text-gray-500">Most Common Crop</div>
        <div className="text-2xl font-bold text-gray-800">
          {metrics.mostCommonCrop}
        </div>
        <div className="text-xs text-gray-500">
          {metrics.cropPercentage}% of all cultivation
        </div>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
        <div className="text-sm text-gray-500">Primary Season</div>
        <div className="text-2xl font-bold text-gray-800">
          {metrics.primarySeason}
        </div>
        <div className="text-xs text-gray-500">
          {metrics.seasonPercentage}% of records
        </div>
      </div>
    </div>
  );
}
