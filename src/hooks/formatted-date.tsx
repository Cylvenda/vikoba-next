export const formatUTCDate = (utcString: string): string => {
     const date = new Date(utcString)

     return date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
     })
}