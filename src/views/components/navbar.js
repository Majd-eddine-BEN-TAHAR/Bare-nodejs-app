function navbar(isLoggedIn) {
  const baseLinks = [{ href: "/", text: "Home" }];

  const loggedInLinks = [
    { href: "/posts", text: "Posts" },
    { href: "/profile", text: "Profile" },
    { href: "/logout", text: "Logout" },
  ];

  const loggedOutLinks = [
    { href: "/register", text: "Register" },
    { href: "/login", text: "Login" },
  ];

  const finalLinks = [
    ...baseLinks,
    ...(isLoggedIn ? loggedInLinks : loggedOutLinks),
  ];

  return `
      <nav>
        <ul>
          ${finalLinks
            .map((link) => `<li><a href="${link.href}">${link.text}</a></li>`)
            .join("")}
        </ul>
      </nav>
    `;
}

module.exports = navbar;
