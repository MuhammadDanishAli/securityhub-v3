const clients = [
    {
      id: 1,
      name: 'Ali',
      homes: [
        { siteId: 1, siteType: 'House', address: '123 Main St', zones: { normal: ["Living Room", "Kitchen"], alert: ["Front Door"] } },
        { siteId: 2, siteType: 'Storage', address: '456 Elm St', zones: { normal: ["Storage Room", "Office"], alert: ["Back Door"] } },
      ]
    },
    {
      id: 2,
      name: 'Ahmed',
      homes: [
        { siteId: 3, siteType: 'Shop1', address: '789 Oak St', zones: { normal: ["Main Hall"], alert: ["Shop Entrance"] } },
        { siteId: 4, siteType: 'Shop2', address: '101 Pine St', zones: { normal: ["Cash Counter"], alert: ["Emergency Exit"] } },
      ]
    },
    {
      id: 3,
      name: 'Sara',
      homes: [
        { siteId: 5, siteType: 'Factory', address: '789 Oak St', zones: { normal: ["Gate"], alert: ["Office"] } },
      ]
    }
  ];
  
  export default clients;