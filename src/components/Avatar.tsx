// Round profile picture. Without a picture it shows the first letter of the name.

export default function Avatar({
  photo,
  name,
  size = 32,
}: {
  photo?: string | null;
  name?: string | null;
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name ? `${name}'s picture` : "Profile picture"} className="avatar" style={style} />;
  }
  return (
    <span className="avatar avatar-initial" style={style} aria-hidden="true">
      {(name?.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
