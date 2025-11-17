import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { validateAddress } from "../_core/addressValidation";

export const addressValidationRouter = router({
  validate: publicProcedure
    .input(z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await validateAddress({
        street: input.street,
        city: input.city,
        state: input.state,
        zip: input.zip,
        country: input.country,
      });
      
      return result;
    }),
});
