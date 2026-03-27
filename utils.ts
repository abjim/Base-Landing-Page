export const toBengaliNumber = (num: number | string): string => {
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bengali = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(c => {
    const index = english.indexOf(c);
    return index > -1 ? bengali[index] : c;
  }).join('');
};
