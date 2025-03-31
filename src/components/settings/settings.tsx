/* eslint-disable @typescript-eslint/no-explicit-any */
import classNames from "classnames";

import { PiGearSixFill } from "react-icons/pi";
// @ts-expect-error not needed
import { PROVIDERS } from "./../../../utils/providers";

function Settings({
  open,
  onClose,
  provider,
  error,
  onChange,
}: {
  open: boolean;
  provider: string;
  error?: string;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (provider: string) => void;
}) {
  return (
    <div className="">
      <button
        className="relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-full text-base font-semibold size-8 text-center bg-gray-800 hover:bg-gray-700 text-gray-100 shadow-sm dark:shadow-highlight/20"
        onClick={() => {
          onClose((prev) => !prev);
        }}
      >
        <PiGearSixFill />
      </button>
      <div
        className={classNames(
          "h-screen w-screen bg-black/20 fixed left-0 top-0 z-10",
          {
            "opacity-0 pointer-events-none": !open,
          }
        )}
        onClick={() => onClose(false)}
      ></div>
      <div
        className={classNames(
          "absolute top-0 -translate-y-[calc(100%+16px)] right-0 z-10 w-96 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-75 overflow-hidden",
          {
            "opacity-0 pointer-events-none": !open,
          }
        )}
      >
        <header className="flex items-center text-sm px-4 py-2 border-b border-gray-200 gap-2 bg-gray-100 font-semibold text-gray-700">
          <span className="text-xs bg-blue-500/10 text-blue-500 rounded-full pl-1.5 pr-2.5 py-0.5 flex items-center justify-start gap-1.5">
            Provider
          </span>
          Customize Settings
        </header>
        <main className="px-4 pt-3 pb-4 space-y-3">
          {error !== "" && (
            <p className="text-red-500 text-sm font-medium mb-2 flex items-center justify-between bg-red-500/10 p-2 rounded-md">
              {error}
            </p>
          )}
          <label className="block">
            <p className="text-gray-500 text-sm font-medium mb-2 flex items-center justify-between">
              Inference Provider
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {PROVIDERS.map((item: any) => (
                <div
                  key={item.id}
                  className={classNames(
                    "text-gray-600 text-sm font-medium cursor-pointer border p-2 rounded-md flex items-center justify-start gap-2",
                    {
                      "bg-blue-500/10 border-blue-500/15 text-blue-500":
                        item.id === provider,
                      "hover:bg-gray-100 border-gray-100": item.id !== provider,
                    }
                  )}
                  onClick={() => {
                    onChange(item.id);
                  }}
                >
                  <img
                    src={`/providers/${item.id}.svg`}
                    alt={item.name}
                    className="size-5"
                  />
                  {item.name}
                </div>
              ))}
            </div>
            {/* <input
              type="password"
              autoComplete="off"
              className="mr-2 border rounded-md px-3 py-1.5 border-gray-300 w-full text-sm"
              placeholder="hf_******"
              value={tokenStorage[0] as string}
              onChange={(e) => {
                if (e.target.value.length > 0) {
                  tokenStorage[1](e.target.value);
                } else {
                  tokenStorage[2]();
                }
              }}
            /> */}
          </label>
        </main>
      </div>
    </div>
  );
}
export default Settings;
