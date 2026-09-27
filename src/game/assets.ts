export type Art = {
  alice: HTMLImageElement;
  infantry: HTMLImageElement;
  heavies: HTMLImageElement;
  rocket: HTMLImageElement;
  boom: HTMLImageElement;
  fx: HTMLImageElement;
  ground: HTMLImageElement;
  palm: HTMLImageElement;
  bush: HTMLImageElement;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Не удалось загрузить спрайт ${src}`));
    img.src = src;
  });
}

export async function loadArt(): Promise<Art> {
  const [alice, infantry, heavies, rocket, boom, fx, ground, palm, bush] = await Promise.all([
    loadImage("/sprites/alice.png?v=2"),
    loadImage("/sprites/infantry.png"),
    loadImage("/sprites/heavies.png"),
    loadImage("/sprites/rocket.png"),
    loadImage("/sprites/boom.png"),
    loadImage("/sprites/fx.png"),
    loadImage("/sprites/ground.png"),
    loadImage("/sprites/palm.png"),
    loadImage("/sprites/bush.png"),
  ]);
  return { alice, infantry, heavies, rocket, boom, fx, ground, palm, bush };
}
