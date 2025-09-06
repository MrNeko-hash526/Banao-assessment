
import Signup from "./AuthPages/Signup";
import Login from "./AuthPages/Login";
import { Provider } from "./components/ui/provider";
import { ToastProvider } from "./components/ui/toast";
import DocDash from "./dashboards/DocDash";
import PatientDash from "./dashboards/PatientDash";
import BlogDetail from "./blogs/BlogDetail";

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './layout/MainLayout';



const App = () => {
  return (
    <Provider>
      <ToastProvider>
        {/* Use createBrowserRouter + RouterProvider and opt into react-router v7 future flags to avoid console warnings */}
        {
          // build router with future flags; cast to any to satisfy TypeScript types for now
        }
        {(() => {
          const routes = [
            { path: '/login', element: <Login /> },
            { path: '/signup', element: <Signup /> },
            {
              path: '/',
              element: <MainLayout />,
              children: [
                { index: true, element: <PatientDash /> },
                { path: 'patient-dashboard', element: <PatientDash /> },
                { path: 'doctor-dashboard', element: <DocDash /> },
                { path: 'blogs/:id', element: <BlogDetail /> },
              ]
            }
          ];

          // create router and opt into v7 future behavior; cast options to any to avoid TS type error
          const router = createBrowserRouter(routes as any, ( { future: { v7_startTransition: true, v7_relativeSplatPath: true } } as any ));
          return <RouterProvider router={router} />;
        })()}
      </ToastProvider>
    </Provider>
  );
};

export default App;
