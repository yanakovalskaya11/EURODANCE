import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminOrdersPanel.css'; 
import { toast } from 'react-toastify';

const AdminOrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const statuses = ['Готово к получению', 'Доставляется', 'Получено'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Ошибка при загрузке заказов:', err);
    }
  };

  const handleStatusChange = async (userThingId, newStatus) => {
    try {
      await axios.patch('http://localhost:5000/api/admin/order-status', {
        userThingId,
        newStatus,
      });
      fetchOrders(); 
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
      toast.error('Ошибка при обновлении статуса');
    }
  };

  return (
    <div className="admin-orders-panel">
      <h2>Панель администратора: заказы</h2>
      <table>
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Предмет</th>
          
            <th>Текущий статус</th>
            <th>Изменить статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.user_thing_id}>
              <td>{order.user_name} {order.user_surname}</td>
              <td>{order.thing_name}</td>
             
              <td>{order.status}</td>
              <td>
                <select
                  value={order.status}
                  onChange={(e) =>
                    handleStatusChange(order.user_thing_id, e.target.value)
                  }
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOrdersPanel;
