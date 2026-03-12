const AMAP_KEY = process.env.AMAP_KEY;

async function getCityAdcode(city) {
  const districtUrl = `https://restapi.amap.com/v3/config/district?keywords=${encodeURIComponent(city)}&subdistrict=0&extensions=base&key=${AMAP_KEY}`;
  const districtRes = await fetch(districtUrl);
  const districtData = await districtRes.json();

  if (districtData.status !== "1") {
    throw new Error(`获取城市编码失败: ${districtData.info || "未知错误"}`);
  }

  const districts = districtData.districts || [];
  const matchedDistrict = districts.find((item) => item.adcode) || null;

  if (!matchedDistrict) {
    return null;
  }

  return matchedDistrict.adcode;
}

export async function getWeather(city) {
  try {
    console.log("调用中");

    const adcode = await getCityAdcode(city);
    if (!adcode) {
      return `找不到城市: ${city}`;
    }

    // 2. 用 adcode 查询天气
    const weatherUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=${adcode}&key=${AMAP_KEY}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    if (weatherData.status !== "1") {
      console.log("获取天气失败");
      return `获取天气失败: ${weatherData.info}`;
    }

    const live = weatherData.lives[0];
    return `${city} (${live.city}) 当前天气：${live.weather}，温度 ${live.temperature}°C`;
  } catch (error) {
    console.log("系统错误");
    return `系统错误: ${error.message}`;
  }
}
