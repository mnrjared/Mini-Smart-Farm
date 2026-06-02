/* old imports
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { PublicLanding } from "./screens/hub-tile/PublicLanding";
import { Dashboard } from "./screens/hub-tile/Dashboard";
import { Login } from "./screens/hub-tile/Login";
import { Register } from "./screens/hub-tile/Register";
import { PowerGeneration } from "./screens/power-tile/PowerGeneration";
import { ChickenCoop } from "./screens/coop-tile/ChickenCoop";
import { CropFarm } from "./screens/crop-tile/CropFarm";
import { WaterDistribution } from "./screens/water-tile/WaterDistribution";
import { NotFound } from "./screens/hub-tile/NotFound";
*/

import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { PublicLanding } from "./screens/hub-tile/PublicLanding";
import { Dashboard } from "./screens/hub-tile/Dashboard";
import { Login } from "./screens/hub-tile/Login";
import { Register } from "./screens/hub-tile/Register";
import { PowerGeneration } from "./screens/power-tile/PowerGeneration";
import  Coop  from "./screens/coop-tile/coop";
import  Chicken  from "./screens/coop-tile/chicken";
import  Chicken_dashboard  from "./screens/coop-tile/chicken_dashboard";
import { CropFarm } from "./screens/crop-tile/CropFarm";
import { WaterDistribution } from "./screens/water-tile/WaterDistribution";
import { NotFound } from "./screens/hub-tile/NotFound";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLanding,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/dashboard",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "power-generation", Component: PowerGeneration },
      // { path: "chicken-coop/coop", Component: ChickenCoop },
      { path: "chicken-coop/coop", Component: Coop, handle: { mainWidthClass: "max-w-none"} },
      // { path: "chicken-coop/chicken", Component: Chicken },
      { path: "chicken-coop/chicken", Component: Chicken, handle: { mainWidthClass: "max-w-none"} },
      // { path: "chicken-coop/chicken-dashboard", Component: Chicken_dashboard },
      { path: "chicken-coop/chicken-dashboard", Component: Chicken_dashboard, handle: { mainWidthClass: "max-w-none"} },
      { path: "crop-farm", Component: CropFarm },
      { path: "water-distribution", Component: WaterDistribution },
      { path: "*", Component: NotFound },
    ],



    /*old dashboard paths
    path: "/dashboard",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "power-generation", Component: PowerGeneration },
      { path: "chicken-coop", Component: ChickenCoop },
      { path: "crop-farm", Component: CropFarm },
      { path: "water-distribution", Component: WaterDistribution },
      { path: "*", Component: NotFound },
    ],
  */

  },
]);