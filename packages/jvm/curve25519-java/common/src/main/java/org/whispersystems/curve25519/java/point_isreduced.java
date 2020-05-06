package org.whispersystems.curve25519.java;

public class point_isreduced {
    public static boolean point_isreduced(byte[] p)
    {
        byte prevp31Value = p[31];
        p[31] &= 0x7F; /* mask off sign bit */
        int[] result = fe_isreduced.fe_isreduced(p);
        p[31] = prevp31Value;
        return result != null;
    }

}
