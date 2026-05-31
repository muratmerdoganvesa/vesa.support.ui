export const isValidDate = (dateString: string): boolean => {
    // Tarih formatını kontrol eden regex
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(dateString)) {
        return false;
    }

    // Tarih değerinin geçerli olup olmadığını kontrol eder
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export const parseDateString = (dateString: any) => {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
};

export function convertToGmtPlus3(isoDateString: string): string {
    // Tarih zaman dizgesini Date nesnesine dönüştür
    const date = new Date(isoDateString);

    // GMT+3 saat dilimi için dakika cinsinden offset (3 saat * 60 dakika)
    const gmtPlus3Offset = 3 * 60;

    // UTC zamanını al
    const utcTime = date.getTime() - date.getTimezoneOffset() * 60000;

    // GMT+3 zamanını hesapla
    const gmtPlus3Time = new Date(utcTime + gmtPlus3Offset * 60000);

    // GMT+3 tarih zaman dizgesini döndür
    return gmtPlus3Time.toUTCString();
}


export const getStatusText = (state: number) => {
    switch (state) {
        case 2:
            return 'Tamamlandı';
        case 4:
            return 'Süreç Başa Döndü';
        case 1:
            return 'Onay Sürecinde';
    }
};

export const isDecimal = (value: string): boolean => {
    const number = parseFloat(value);
    return !isNaN(number) && isFinite(number);
};

export function formatDateTime(isoDateString: string) {
    const date = new Date(isoDateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Aylar 0-indexlidir, +1 eklenmeli
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}