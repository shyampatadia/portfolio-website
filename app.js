function App() {
  const [content, setContent] = React.useState('');
  const [posts, setPosts] = React.useState([]);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [token, setToken] = React.useState(null);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    fetch('template.html')
      .then(res => res.text())
      .then(html => setContent(html));
    fetchPosts();
  }, []);

  function fetchPosts() {
    fetch('http://localhost:8000/posts')
      .then(res => res.json())
      .then(data => setPosts(data));
  }

  function login(e) {
    e.preventDefault();
    fetch('http://localhost:8000/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password})
    })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          setToken(data.access_token);
        }
      });
  }

  function createPost(e) {
    e.preventDefault();
    fetch('http://localhost:8000/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({title, body})
    })
      .then(res => res.json())
      .then(() => {
        setTitle('');
        setBody('');
        fetchPosts();
      });
  }

  return (
    <div>
      <div dangerouslySetInnerHTML={{__html: content}} />
      <section className="p-6" id="blog">
        <h2 className="text-2xl font-bold mb-4">Blog</h2>
        {token ? (
          <form onSubmit={createPost} className="mb-4 space-y-2">
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full text-black p-2" placeholder="Title" />
            <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full text-black p-2" placeholder="Body" />
            <button type="submit" className="px-4 py-2 bg-blue-600 rounded">Publish</button>
          </form>
        ) : (
          <form onSubmit={login} className="mb-4 space-y-2">
            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full text-black p-2" placeholder="Username" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full text-black p-2" placeholder="Password" />
            <button type="submit" className="px-4 py-2 bg-blue-600 rounded">Login</button>
          </form>
        )}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-[#232a3a] p-4 rounded">
              <h3 className="text-xl font-semibold">{post.title}</h3>
              <p>{post.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
