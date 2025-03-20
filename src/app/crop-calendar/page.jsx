import Link from "next/link";

function CropCalendar() {
  const toSlug = (stateName) => {
    return stateName.toLowerCase().replace(/\s+/g, "-");
  };

  const states = ["Bihar", "Jharkhand", "Odisha"];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-800">
            State Level Crop Calendar
          </h1>
        </div>
      </div>

      <div className="flex-1 mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded-lg shadow mb-8">
          <p className="text-gray-600 mb-6">
            Select a state to view its crop calendar information and
            agricultural flow.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-16">
            {states.map((state) => (
              <Link
                key={state}
                href={`/crop-calendar/${toSlug(state)}`}
                className="block p-4 border rounded-lg border-mtn-green-800 hover:bg-green-100 transition duration-150"
              >
                <div className="flex items-center justify-center">
                  <span className="text-mtn-green-800 font-bold">{state}</span>
                  {/*

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                 */}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            About Crop Calendars
          </h2>
          <p className="text-gray-600 mb-4">
            Crop calendars provide essential information about agricultural
            patterns across different states in India. The visualization shows
            relationships between states, seasons, crops, and districts.
          </p>
          <p className="text-gray-600">
            Select a state from the options above to explore detailed
            agricultural flow data using interactive Sankey diagrams.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CropCalendar;
