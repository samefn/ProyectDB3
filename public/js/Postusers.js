let rules = {
    // MINÚSCULAS
    "a": "k9jS1", "b": "pQ7bN", "c": "zX3vC", "d": "mO8pL", "e": "nS5jM",
    "f": "aZ6wS", "g": "vB7nU", "h": "lK4jH", "i": "oP2iU", "j": "rT9yY",
    "k": "qW0eE", "l": "sD1fG", "m": "hJ6kL", "n": "gH5jK", "o": "pL9oI",
    "p": "iU3tY", "q": "bV8cZ", "r": "eW4rT", "s": "tG6hJ", "t": "yY7uI",
    "u": "iO1pA", "v": "xS2dF", "w": "cM3kL", "x": "uJ4hG", "y": "dF5gH",
    "z": "wE6rT",
    // MAYÚSCULAS
    "A": "Zz9aY", "B": "Yy8bX", "C": "Xx7cW", "D": "Ww6dV", "E": "Vv5eU",
    "F": "Uu4fT", "G": "Tt3gS", "H": "Ss2hR", "I": "Rr1iQ", "J": "Qq0jP",
    "K": "Pp9kO", "L": "Oo8lN", "M": "Nn7mM", "N": "Mm6nL", "O": "Ll5oK",
    "P": "Kk4pJ", "Q": "Jj3qI", "R": "Ii2rH", "S": "Hh1sG", "T": "Gg0tF",
    "U": "Ff9uE", "V": "Ee8vD", "W": "Dd7wC", "X": "Cc6xB", "Y": "Bb5yA",
    "Z": "Aa4zZ",
    // NÚMEROS
    "0": "rT1yU", "1": "qW2eR", "2": "pS3dN", "3": "zX4cV", "4": "mK5jH",
    "5": "lO6iU", "6": "bH7gJ", "7": "vC8xZ", "8": "uJ9mN", "9": "aZ0wS"
};

function ApplyRules(hash_password) {
  let password = "";
  const arraypassword = Array.from(hash_password);
  for (let i = 0; i < arraypassword.length; i++) {
    let character = arraypassword[i];
    if (rules[character] === undefined) {
      password += character;
    } else {
      password += rules[character];
    }
  }
  return password;
}

document.getElementById('postUserForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const formData = new FormData(event.target);

  let original = formData.get('password');
  let hashed = ApplyRules(original);
  console.log("Contraseña cifrada (Registro):", hashed);

  const data = {
    name: formData.get('name'),
    password: hashed 
  };

  try {
    const response = await fetch('/mysql/postUser', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const message = await response.text();
    document.getElementById('postNoSqlResult').innerText = message;

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('postNoSqlResult').innerText = 'Error sending the form.';
  }
});