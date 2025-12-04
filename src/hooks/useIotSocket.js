import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useIotSocket() {
  const [connected, setConnected] = useState(false);
  const [latestReading, setLatestReading] = useState(null);
  const [brokersStatus, setBrokersStatus] = useState({});
  const [sensorStatus, setSensorStatus] = useState({});
  const [bulkReadings, setBulkReadings] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const baseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
    console.log('🔌 Connecting to IoT WebSocket at:', `${baseUrl}/iot`);
    
    const socket = io(`${baseUrl}/iot`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to IoT WebSocket');
      setConnected(true);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from IoT WebSocket:', reason);
      setConnected(false);
    });

    socket.on('reading', (reading) => {
      console.log('New reading received:', reading);
      setLatestReading(reading);
    });

    socket.on('brokerStatus', ({ brokerId, status }) => {
      console.log(`Broker ${brokerId} status: ${status}`);
      setBrokersStatus(prev => ({
        ...prev,
        [brokerId]: status === 'connected'
      }));
    });

    socket.on('sensorStatus', ({ deviceId, status }) => {
      console.log(`Sensor ${deviceId} status: ${status}`);
      setSensorStatus(prev => ({
        ...prev,
        [deviceId]: status === 'online'
      }));
    });

    socket.on('bulkReadings', (readings) => {
      console.log('Bulk readings received:', readings);
      setBulkReadings(readings);
    });

    socket.on('dashboardUpdate', (data) => {
      console.log('Dashboard data updated:', data);
      setDashboardData(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const emitMessage = (event, data) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    connected,
    latestReading,
    brokersStatus,
    sensorStatus,
    bulkReadings,
    dashboardData,
    emitMessage,
    isBrokerConnected: (brokerId) => brokersStatus[brokerId] || false,
    isSensorOnline: (deviceId) => sensorStatus[deviceId] || false,
    getLatestReadingByDevice: (deviceId) => {
      if (!latestReading || latestReading.deviceId !== deviceId) return null;
      return latestReading;
    },
  };
}
