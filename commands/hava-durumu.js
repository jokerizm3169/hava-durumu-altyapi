const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../config.json');
const cheerio = require('cheerio');

// OpenWeatherMap API ile gerçek hava durumu alma fonksiyonu
async function getWeatherData(city) {
    try {
        // OpenWeatherMap API key'inizi buraya girin
        const apiKey = '14d1949d313157d79478e28311c66a4d'; // Kendi API key'inizi buraya yazın
        
        // Mevcut hava durumu
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
        
        // 5 günlük tahmin
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
        
        // Her iki API'yi paralel olarak çağır
        const [currentResponse, forecastResponse] = await Promise.all([
            axios.get(currentWeatherUrl, { timeout: 10000 }),
            axios.get(forecastUrl, { timeout: 10000 })
        ]);

        const current = currentResponse.data;
        const forecast = forecastResponse.data;

        // Hava durumu açıklamasını Türkçe'ye çevir
        const translateCondition = (condition) => {
            const translations = {
                'clear sky': 'Açık',
                'few clouds': 'Az Bulutlu',
                'scattered clouds': 'Parçalı Bulutlu',
                'broken clouds': 'Bulutlu',
                'overcast clouds': 'Kapalı',
                'light rain': 'Hafif Yağmur',
                'moderate rain': 'Orta Şiddetli Yağmur',
                'heavy intensity rain': 'Şiddetli Yağmur',
                'very heavy rain': 'Çok Şiddetli Yağmur',
                'extreme rain': 'Aşırı Yağmur',
                'freezing rain': 'Dondurucu Yağmur',
                'light intensity shower rain': 'Hafif Sağanak',
                'shower rain': 'Sağanak',
                'heavy intensity shower rain': 'Şiddetli Sağanak',
                'ragged shower rain': 'Düzensiz Sağanak',
                'thunderstorm': 'Gök Gürültülü Fırtına',
                'thunderstorm with light rain': 'Hafif Yağmurlu Fırtına',
                'thunderstorm with rain': 'Yağmurlu Fırtına',
                'thunderstorm with heavy rain': 'Şiddetli Yağmurlu Fırtına',
                'light thunderstorm': 'Hafif Fırtına',
                'heavy thunderstorm': 'Şiddetli Fırtına',
                'ragged thunderstorm': 'Düzensiz Fırtına',
                'thunderstorm with light drizzle': 'Çiseleyen Fırtına',
                'thunderstorm with drizzle': 'Çiseleli Fırtına',
                'thunderstorm with heavy drizzle': 'Şiddetli Çiseleli Fırtına',
                'light intensity drizzle': 'Hafif Çiseleme',
                'drizzle': 'Çiseleme',
                'heavy intensity drizzle': 'Şiddetli Çiseleme',
                'light intensity drizzle rain': 'Hafif Çiselemeli Yağmur',
                'drizzle rain': 'Çiselemeli Yağmur',
                'heavy intensity drizzle rain': 'Şiddetli Çiselemeli Yağmur',
                'shower rain and drizzle': 'Sağanak ve Çiseleme',
                'heavy shower rain and drizzle': 'Şiddetli Sağanak ve Çiseleme',
                'shower drizzle': 'Sağanak Çiseleme',
                'light snow': 'Hafif Kar',
                'snow': 'Kar',
                'heavy snow': 'Yoğun Kar',
                'sleet': 'Karla Karışık Yağmur',
                'light shower sleet': 'Hafif Karla Karışık Sağanak',
                'shower sleet': 'Karla Karışık Sağanak',
                'light rain and snow': 'Hafif Yağmur ve Kar',
                'rain and snow': 'Yağmur ve Kar',
                'light shower snow': 'Hafif Kar Sağanağı',
                'shower snow': 'Kar Sağanağı',
                'heavy shower snow': 'Şiddetli Kar Sağanağı',
                'mist': 'Pus',
                'smoke': 'Duman',
                'haze': 'Sis',
                'sand/dust whirls': 'Kum/Toz Girdabı',
                'fog': 'Sis',
                'sand': 'Kum',
                'dust': 'Toz',
                'volcanic ash': 'Volkanik Kül',
                'squalls': 'Fırtına',
                'tornado': 'Hortum'
            };
            return translations[condition.toLowerCase()] || condition;
        };

        // Günlük tahminleri işle (her gün için bir tahmin)
        const dailyForecast = [];
        const processedDays = new Set();
        
        forecast.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!processedDays.has(dayKey) && dailyForecast.length < 3) {
                const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
                dailyForecast.push({
                    day: dayName,
                    high: Math.round(item.main.temp_max),
                    low: Math.round(item.main.temp_min),
                    desc: translateCondition(item.weather[0].description)
                });
                processedDays.add(dayKey);
            }
        });

        return {
            location: `${current.name}, ${current.sys.country}`,
            temperature: Math.round(current.main.temp),
            condition: translateCondition(current.weather[0].description),
            humidity: `%${current.main.humidity}`,
            wind: `${Math.round(current.wind.speed * 3.6)} km/sa`, // m/s'den km/sa'ye çevir
            precipitation: forecast.list[0] ? `%${Math.round((forecast.list[0].pop || 0) * 100)}` : '%0',
            dailyForecast: dailyForecast,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Weather API error:', error);
        if (error.response && error.response.status === 404) {
            throw new Error('Şehir bulunamadı');
        } else if (error.response && error.response.status === 401) {
            throw new Error('API key geçersiz veya henüz aktif değil. Lütfen birkaç saat bekleyin.');
        }
        throw new Error('Hava durumu bilgileri alınamadı');
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hava-durumu')
        .setDescription('Hava durumu bilgilerini gösterir')
        .addSubcommand(subcommand =>
            subcommand
                .setName('sehir')
                .setDescription('Belirtilen şehrin hava durumunu gösterir')
                .addStringOption(option =>
                    option
                        .setName('konum')
                        .setDescription('Hava durumunu öğrenmek istediğiniz şehir')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('guncel')
                .setDescription('Varsayılan konum için güncel hava durumunu gösterir')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            let konum = 'istanbul'; // Varsayılan konum

            if (subcommand === 'sehir') {
                konum = interaction.options.getString('konum');
            }

            // Hava durumu verilerini al (önce veriyi al, sonra yanıt ver)
            const weatherData = await getWeatherData(konum);

            // Hava durumu durumuna göre emoji belirle
            const getWeatherEmoji = (condition) => {
                const conditionLower = condition.toLowerCase();
                if (conditionLower.includes('güneş') || conditionLower.includes('açık')) return '☀️';
                if (conditionLower.includes('parçalı') || conditionLower.includes('az bulut')) return '⛅';
                if (conditionLower.includes('bulut')) return '☁️';
                if (conditionLower.includes('yağmur') || conditionLower.includes('sağanak')) return '🌧️';
                if (conditionLower.includes('kar')) return '❄️';
                if (conditionLower.includes('sis') || conditionLower.includes('pus')) return '🌫️';
                if (conditionLower.includes('fırtına') || conditionLower.includes('gök gürültü')) return '⛈️';
                if (conditionLower.includes('rüzgar')) return '💨';
                return '🌤️';
            };

            // Kullanıcının rol rengini al
            const userColor = interaction.member?.displayColor || 0x0099ff;
            
            // Hava durumu durumuna göre renk belirle (eğer kullanıcının rengi yoksa)
            const getWeatherColor = (condition) => {
                if (userColor !== 0) return userColor; // Kullanıcının rengi varsa onu kullan
                
                const conditionLower = condition.toLowerCase();
                if (conditionLower.includes('güneş') || conditionLower.includes('açık')) return 0xFFD700; // Altın sarısı
                if (conditionLower.includes('parçalı') || conditionLower.includes('az bulut')) return 0x87CEEB; // Açık mavi
                if (conditionLower.includes('bulut')) return 0x708090; // Gri
                if (conditionLower.includes('yağmur') || conditionLower.includes('sağanak')) return 0x4682B4; // Çelik mavisi
                if (conditionLower.includes('kar')) return 0xF0F8FF; // Alice mavisi
                if (conditionLower.includes('sis') || conditionLower.includes('pus')) return 0xD3D3D3; // Açık gri
                if (conditionLower.includes('fırtına') || conditionLower.includes('gök gürültü')) return 0x483D8B; // Koyu mor
                return 0x0099ff; // Varsayılan mavi
            };

            // Sıcaklığa göre emoji ve renk
            const getTempEmoji = (temp) => {
                if (temp >= 30) return '🔥';
                if (temp >= 25) return '☀️';
                if (temp >= 15) return '🌤️';
                if (temp >= 5) return '🌥️';
                if (temp >= 0) return '❄️';
                return '🧊';
            };

            // Embed oluştur
            const embed = new EmbedBuilder()
                .setColor(getWeatherColor(weatherData.condition))
                .setTitle(`${getWeatherEmoji(weatherData.condition)} ${weatherData.location}`)
                .setDescription(`**${weatherData.condition}** - Güncel hava durumu`)
                .addFields(
                    {
                        name: '🌡️ Sıcaklık',
                        value: `${weatherData.temperature}°C`,
                        inline: true
                    },
                    {
                        name: '💧 Nem',
                        value: weatherData.humidity,
                        inline: true
                    },
                    {
                        name: '💨 Rüzgar',
                        value: weatherData.wind,
                        inline: true
                    },
                    {
                        name: '🌧️ Yağış İhtimali',
                        value: weatherData.precipitation,
                        inline: true
                    },
                    {
                        name: '📍 Konum',
                        value: weatherData.location,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ 
                    text: 'Hava Durumu',
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });

            // Günlük tahmin varsa ekle
            if (weatherData.dailyForecast && weatherData.dailyForecast.length > 0) {
                const forecastText = weatherData.dailyForecast.slice(0, 3).map(day => 
                    `**${day.day}**: ${day.high}°/${day.low}° - ${day.desc}`
                ).join('\n');
                
                embed.addFields({
                    name: '📅 3 Günlük Tahmin',
                    value: forecastText,
                    inline: false
                });
            }

            // Embed ile yanıt ver
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Hava durumu API hatası:', error);
            
            let errorMessage = 'Hava durumu bilgileri alınırken bir hata oluştu.';
            
            if (error.response) {
                if (error.response.status === 404) {
                    errorMessage = '❌ Belirtilen konum bulunamadı. Lütfen geçerli bir şehir adı girin.';
                } else if (error.response.status === 500) {
                    errorMessage = '❌ Hava durumu servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
                }
            } else if (error.code === 'ENOTFOUND') {
                errorMessage = '❌ İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin.';
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = '❌ İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
            }

            // Kullanıcının rol rengini al (hata için)
            const userColorForError = interaction.member?.displayColor || 0xff0000;
            
            const errorEmbed = new EmbedBuilder()
                .setColor(userColorForError !== 0 ? userColorForError : 0xff0000)
                .setTitle('❌ Hata')
                .setDescription(errorMessage)
                .setTimestamp();

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else {
                    await interaction.reply({ embeds: [errorEmbed] });
                }
            } catch (interactionError) {
                console.error('❌ Interaction error:', interactionError);
                // Eğer interaction cevap verilemezse, en azından konsola yazdır
                console.log(`Hata mesajı: ${errorMessage}`);
            }
        }
    },
};
