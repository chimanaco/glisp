(def w 40)
(def s (/ w 2))

(defn slash [p]
  (->> (line [(- s) (- s)] [s s])
       (path/scale-x [(compare (random p) .5)])
       (path/translate p)))

[:g {:transform (view-center)
     :style (stroke "salmon" 10)}
 (for [y (column -5 5 w)
       x (column -5 5 w)]
   (slash [x y]))]