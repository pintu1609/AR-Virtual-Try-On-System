import { useState } from "react";


export default function AdminUpload() {
const [form, setForm] = useState({ name: "", price: "", image: null });


const handleChange = (e) => {
const { name, value, files } = e.target;
if (name === "image") setForm({ ...form, image: files[0] });
else setForm({ ...form, [name]: value });
};


const handleSubmit = async (e) => {
e.preventDefault();
const data = new FormData();
data.append("name", form.name);
data.append("price", form.price);
data.append("image", form.image);


await fetch("http://localhost:5000/api/outfits/upload", {
method: "POST",
body: data,
});


alert("Dress uploaded successfully");
};


return (
<div className="p-4">
<h2 className="text-xl font-bold mb-3">Admin Upload Dress</h2>
<form onSubmit={handleSubmit} className="space-y-3">
<input name="name" placeholder="Dress Name" onChange={handleChange} className="border p-2 w-full" required />
<input name="price" placeholder="Price" onChange={handleChange} className="border p-2 w-full" required />
<input name="image" type="file" onChange={handleChange} className="border p-2 w-full" required />
<button className="bg-black text-white px-4 py-2">Upload</button>
</form>
</div>
);
}