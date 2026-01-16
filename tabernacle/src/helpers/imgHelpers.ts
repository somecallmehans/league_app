export type Image = {
  artist: string;
  url: string;
};

export const compileImgUrls = (
  img1: Image[],
  img2: Image[] | undefined | null,
  img3: Image[] | undefined | null
) => {
  const imgs: string[] = [];
  const artists: string[] = [];
  img1?.forEach((i: Image) => {
    imgs.push(i.url);
    artists.push(i.artist);
  });
  if (img2) {
    img2.forEach((i: Image) => {
      imgs.push(i.url);
      artists.push(i.artist);
    });
  }
  if (img3) {
    img3.forEach((i: Image) => {
      imgs.push(i.url);
      artists.push(i.artist);
    });
  }

  return { imgs, artists };
};
