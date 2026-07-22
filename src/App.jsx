import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import MyTickets from './pages/MyTickets';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/evento/:id" element={<EventDetails />} />
          <Route path="/criar" element={<CreateEvent />} />
          <Route path="/checkout/:eventId" element={<Checkout />} />
          <Route path="/confirmacao/:orderId" element={<OrderConfirmation />} />
          <Route path="/meus-ingressos" element={<MyTickets />} />
          <Route path="/painel" element={<Dashboard />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
