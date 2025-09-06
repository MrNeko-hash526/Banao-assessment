
import Signup from "./AuthPages/Signup";
import Login from "./AuthPages/Login";
import { Provider } from "./components/ui/provider";
import { ToastProvider } from "./components/ui/toast";
import DocDash from "./dashboards/DocDash";
import PatientDash from "./dashboards/PatientDash";
import BlogListPage from './blogs/BlogListPage';
import BlogDetailPage from './blogs/BlogDetailPage';
import DoctorBlogDetailPage from './blogs/DoctorBlogDetailPage';
import CreateBlog from './blogs/CreateBlog';
import DoctorBlogDashboard from './blogs/DoctorBlogDashboard';
import ProtectedRoute from './layout/ProtectedRoute';
import PatientBlogDashboard from './blogs/PatientBlogDashboard.tsx';

import About from './pages/About';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './layout/MainLayout';



const App = () => {
  return (
    <Provider>
      <ToastProvider>
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
                { path: 'about', element: <About /> },
                { path: 'blogs', element: <BlogListPage /> },
                { path: 'blogs/create', element: <CreateBlog /> },
                { path: 'blogs/:id', element: <BlogDetailPage /> },
                { path: 'blogs/doctor/:id', element: <ProtectedRoute allowedRole="doctor"><DoctorBlogDetailPage /></ProtectedRoute> },
                // Doctor blog management (protected)
                { path: 'blogs/doctor', element: <ProtectedRoute allowedRole="doctor"><DoctorBlogDashboard /></ProtectedRoute> },
                { path: 'blogs/doctor/new', element: <ProtectedRoute allowedRole="doctor"><CreateBlog /></ProtectedRoute> },
                { path: 'blogs/doctor/edit/:id', element: <ProtectedRoute allowedRole="doctor"><CreateBlog /></ProtectedRoute> },
                // Patient blog management (protected)
                { path: 'blogs/patient', element: <ProtectedRoute allowedRole="patient"><PatientBlogDashboard /></ProtectedRoute> },

              ]
            }
          ];
          const router = createBrowserRouter(routes as any, ( { future: { v7_startTransition: true, v7_relativeSplatPath: true } } as any ));
          return <RouterProvider router={router} />;
        })()}
      </ToastProvider>
    </Provider>
  );
};

export default App;
