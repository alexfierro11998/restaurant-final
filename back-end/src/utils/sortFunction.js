function sortFunction(contents){
    if(contents.length <= 1){
        return contents;   
    }
    const middle = Math.floor(contents.length / 2);
    const leftElements = contents.slice(0, middle);
    const rightElements = contents.slice(middle);
    const leftElementsSplit = sortFunction(leftElements);
    const rightElementsSplit = sortFunction(rightElements);
    const sorted = [];
    let leftIndex = 0;
    let rightIndex = 0;
    while(leftIndex < leftElementsSplit.length && rightIndex < rightElementsSplit.length){
        const left = leftElementsSplit[leftIndex].table_name;
        const right = rightElementsSplit[rightIndex].table_name;
        const lengthComparison = left.length - right.length;
        if(lengthComparison <= -3 || lengthComparison >= 3){
            if(lengthComparison <= -3){
                sorted.push(leftElementsSplit[leftIndex]);
                leftIndex++;
            }
            else{
                sorted.push(rightElementsSplit[rightIndex]);
                rightIndex++;
            }
        }else {
            const leftSliceAtNumber = parseInt(left.slice(left.indexOf("#") + 1));
            const rightSliceAtNumber = parseInt(right.slice(right.indexOf("#") + 1));
            if(leftSliceAtNumber <= rightSliceAtNumber){
                sorted.push(leftElementsSplit[leftIndex]);
                leftIndex++;
            }
            else{
                sorted.push(rightElementsSplit[rightIndex]);
                rightIndex++;
            }
        }
    }
    return sorted.concat(leftIndex < leftElementsSplit.length ? leftElementsSplit.slice(leftIndex) : rightElementsSplit.slice(rightIndex));
}

module.exports = {
    sortFunction
}