


export const highlightText = (text: string, query: string) => {
     if (!query) return text;

     const regex = new RegExp(`(${query})`, "gi");
     const parts = text.split(regex);

     return parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
               <span key={index} className="bg-chart-2 text-black rounded px-0.3">
                    {part}
               </span>
          ) : (
               part
          )
     );
};