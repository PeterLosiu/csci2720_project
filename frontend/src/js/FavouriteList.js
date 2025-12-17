// import React, { useEffect, useState } from 'react';

// export default function FavouriteList() {
//   const [favs, setFavs] = useState([]);

//   useEffect(() => {
//     async function load() {
//       try {
//         const token = localStorage.getItem('token');
//         const res = await fetch('http://localhost:3000/api/user/favorites/locations', {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });
//         if (!res.ok) throw new Error(res.statusText);
//         const data = await res.json();
//         setFavs(data);
//       } catch (err) {
//         console.error(err);
//         setFavs([]);
//       }
//     }
//     load();
//   }, []);

//   const removeFav = async (locId) => {
//     try {
//       const token = localStorage.getItem('token');
//       const res = await fetch(`http://localhost:3000/api/favorites/locations/${locId}`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
//       if (!res.ok) throw new Error(res.statusText);
//       setFavs(favs.filter((f) => f._id !== locId));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   return (
//     <div className="p-4">
//       <h2 className="text-2xl font-bold mb-4">My Favourites</h2>
//       {favs.length === 0 && <p className="text-gray-500">No favourites yet.</p>}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {favs.map((fav) => (
//           <div key={fav._id} className="border rounded p-4 flex justify-between items-center">
//             <div>
//               <h3 className="font-semibold">{fav.name}</h3>
//               <p className="text-sm text-gray-600">Quota: {fav.quota}</p>
//             </div>
//             <button
//               onClick={() => removeFav(fav._id)}
//               className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
//             >
//               ❌
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }