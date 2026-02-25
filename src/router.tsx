import { createBrowserRouter } from "react-router-dom";
import FilterPage, { loader as filterLoader } from "./FilterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <FilterPage />,
    loader: filterLoader,
  },
]);